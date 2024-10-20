---
date: 2024-10-19 20:46
description: Basically an info dump on Vision Encoder Decoder Transformers and how you can run them in Swift using ONNX Runtime, and also how to convert them using coremltools
tags: macOS, Swift, CoreML, ONNX, Transformers
---

# Running Vision Encoder Decoder Models in Swift (or any language)

The model I am going to be using for this blog post is `OleehyO/TexTeller` which is made on top of Microsoft's `TrOCR` model (which is bloody good for handwritten text recognition). I am working on an alternative to MathPix's Snipping Tool for macOS and wanted to be able to run this model without requiring to deal with Python.

The title of this post mentions any language as the general strategy of the encoder, decoder, and tokenizer remains the same. 

## Transformers can See??!

Transformers first started "seeing" with the initial VisionTransformer (ViT) architecture. An image is split into patches which are then flattened and embedded with positional encodings. Usually this is for an image classification task where the output is a single class label (or multiple labels for multi-label classification) representing the prediction of the image category. 


The TrOCR paper introduced the idea of using pre-trained image and text transformers for text recognition task in OCR. The basic idea is that an encoder model is used to encode an image which is then fed to the decoder as an input which auto-regressively generates tokens, which the tokenizer then translates back to text.


This Python pseudocode represents how this entire process works.

```python
model = myAmazingVisionEncoderDecoderModel()
tokenizer = myAmazingTokenizer()

last_hidden_state = model.encoder(pixel_values).last_hidden_state

decoder_ids = [tokenizer.bos_token_id]
max_length = 50 

for _ in range(max_length):
    logits = model.decoder(input_ids=decoder_ids, encoder_hidden_state=last_hidden_state)
    next_token = argmax(logits)
    if next_token == tokenizer.eos_token_id:
        break
    decoder_ids.append(next_token)

print(tokenizer.decode(decoder_ids[1:]))
```

Here, `bos` stands for the beginning of speech, and `eos` stands for the end of speech.

### Padding and Attention Mask

In the above code we do not care about the size of `input_ids`, but in some cases we have to provide the input of certain size. Say we *had* to provide an input of size `[1, 100]` we would make use of the padding token. If we only have the decoder tokens `tokenizer.bos_token_id, 280, 95` generated so far, we would pad the rest of the input with `tokenizer.pad_token_id` (say `1`). Then, TrOCR generates an attention mask where it compares the input to mask out the padding token so the model can ignore it.


## Exporting

There are three ways that come to my mind to run this model on-device.

* Ship all necessary Python packages (why would you ever do this if you are not using Python directly)
* Convert to an ONNX model
* Convert to a CoreML model

Converting the model to ONNX/CoreML format requires tracing the model. Since `TrOCR` and `TexTeller` are implemented using PyTorch, we can do this via `torch.jit.trace` or `torch.jit.script`. I like using `torch.jit.trace` because it is a bit more mature.

### Hugging Face 🤗

This is the easiest way to export a model from Huggingface to an ONNX model. 

```bash
$ optimum-cli export onnx --model "OleehyO/TexTeller" exported
```

That's it. The amazing people behind Hugging Face have done a lot of work supporting a lot of models. This command generates a bunch of files in the `exported` directory

```bash
$ ls -la exported
total 5853056
drwxr-xr-x@ 14 navanchauhan  staff        448 Oct 19 19:39 .
drwxr-xr-x@ 19 navanchauhan  staff        608 Oct 19 19:42 ..
-rw-r--r--@  1 navanchauhan  staff      56003 Oct 13 17:33 added_tokens.json
-rw-r--r--@  1 navanchauhan  staff       4504 Oct 13 17:33 config.json
-rw-r--r--@  1 navanchauhan  staff  908716081 Oct 13 17:33 decoder_model.onnx
-rw-r--r--@  1 navanchauhan  staff  909186959 Oct 13 17:33 decoder_model_merged.onnx
-rw-r--r--@  1 navanchauhan  staff  833037201 Oct 13 17:33 decoder_with_past_model.onnx
-rw-r--r--@  1 navanchauhan  staff  343553824 Oct 13 17:33 encoder_model.onnx
-rw-r--r--@  1 navanchauhan  staff        154 Oct 13 17:33 generation_config.json
-rw-r--r--@  1 navanchauhan  staff      70943 Oct 13 17:33 merges.txt
-rw-r--r--@  1 navanchauhan  staff        958 Oct 13 17:33 special_tokens_map.json
-rw-r--r--@  1 navanchauhan  staff    1370259 Oct 13 17:33 tokenizer.json
-rw-r--r--@  1 navanchauhan  staff     592739 Oct 13 17:33 tokenizer_config.json
-rw-r--r--@  1 navanchauhan  staff     146663 Oct 13 17:33 vocab.json
```

If you just care about inferencing, jump to the final section. If you want to see how you can trace the model, continue reading. I may update this section with pure Python code to run the encoder and decoder using `onnxruntime`

### PyTorch Tracing

I extracted all the relevant configuration and utility functions from the TexTeller GitHub repository. I also loaded up a simple example image.

```python
from PIL import Image
import requests

url = 'https://miro.medium.com/v2/resize:fit:1400/1*OReJHtogeA62SmSwzNzgvw.png'
image = Image.open(requests.get(url, stream=True).raw).convert("RGB")

# Formula image(grayscale) mean and variance
IMAGE_MEAN = 0.9545467
IMAGE_STD  = 0.15394445

# Vocabulary size for TexTeller
VOCAB_SIZE = 15000

# Fixed size for input image for TexTeller
FIXED_IMG_SIZE = 448

# Image channel for TexTeller
IMG_CHANNELS = 1  # grayscale image

# Max size of token for embedding
MAX_TOKEN_SIZE = 1024

# Scaling ratio for random resizing when training
MAX_RESIZE_RATIO = 1.15
MIN_RESIZE_RATIO = 0.75

# Minimum height and width for input image for TexTeller
MIN_HEIGHT = 12
MIN_WIDTH  = 30

num_beams = 1

from torchvision.transforms import v2
import torch
import cv2
import numpy as np
from typing import List, Union

general_transform_pipeline = v2.Compose([
    v2.ToImage(),
    v2.ToDtype(torch.uint8, scale=True),  # optional, most input are already uint8 at this point
    v2.Grayscale(),

    v2.Resize(
        size=FIXED_IMG_SIZE - 1,
        interpolation=v2.InterpolationMode.BICUBIC,
        max_size=FIXED_IMG_SIZE,
        antialias=True
    ),

    v2.ToDtype(torch.float32, scale=True),  # Normalize expects float input
    v2.Normalize(mean=[IMAGE_MEAN], std=[IMAGE_STD]),

])

import random
from collections import Counter
import re

def trim_white_border(image: np.ndarray):
    if len(image.shape) != 3 or image.shape[2] != 3:
        raise ValueError("Image is not in RGB format or channel is not in third dimension")

    if image.dtype != np.uint8:
        raise ValueError(f"Image should stored in uint8")

    corners = [tuple(image[0, 0]), tuple(image[0, -1]),
               tuple(image[-1, 0]), tuple(image[-1, -1])]
    bg_color = Counter(corners).most_common(1)[0][0]
    bg_color_np = np.array(bg_color, dtype=np.uint8)

    h, w = image.shape[:2]
    bg = np.full((h, w, 3), bg_color_np, dtype=np.uint8)

    diff = cv2.absdiff(image, bg)
    mask = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)

    threshold = 15
    _, diff = cv2.threshold(mask, threshold, 255, cv2.THRESH_BINARY)

    x, y, w, h = cv2.boundingRect(diff)

    trimmed_image = image[y:y+h, x:x+w]

    return trimmed_image


def add_white_border(image: np.ndarray, max_size: int) -> np.ndarray:
    randi = [random.randint(0, max_size) for _ in range(4)]
    pad_height_size = randi[1] + randi[3]
    pad_width_size  = randi[0] + randi[2]
    if (pad_height_size + image.shape[0] < 30):
        compensate_height = int((30 - (pad_height_size + image.shape[0])) * 0.5) + 1
        randi[1] += compensate_height
        randi[3] += compensate_height
    if (pad_width_size + image.shape[1] < 30):
        compensate_width = int((30 - (pad_width_size + image.shape[1])) * 0.5) + 1
        randi[0] += compensate_width
        randi[2] += compensate_width
    return v2.functional.pad(
        torch.from_numpy(image).permute(2, 0, 1),
        padding=randi,
        padding_mode='constant',
        fill=(255, 255, 255)
    )


def padding(images: List[torch.Tensor], required_size: int) -> List[torch.Tensor]:
    images = [
        v2.functional.pad(
            img,
            padding=[0, 0, required_size - img.shape[2], required_size - img.shape[1]]
        )
        for img in images
    ]
    return images

import re


def change(input_str, old_inst, new_inst, old_surr_l, old_surr_r, new_surr_l, new_surr_r):
    result = ""
    i = 0
    n = len(input_str)

    while i < n:
        if input_str[i:i+len(old_inst)] == old_inst:
            # check if the old_inst is followed by old_surr_l
            start = i + len(old_inst)
        else:
            result += input_str[i]
            i += 1
            continue

        if start < n and input_str[start] == old_surr_l:
            # found an old_inst followed by old_surr_l, now look for the matching old_surr_r
            count = 1
            j = start + 1
            escaped = False
            while j < n and count > 0:
                if input_str[j] == '\\' and not escaped:
                    escaped = True
                    j += 1
                    continue
                if input_str[j] == old_surr_r and not escaped:
                    count -= 1
                    if count == 0:
                        break
                elif input_str[j] == old_surr_l and not escaped:
                    count += 1
                escaped = False
                j += 1

            if count == 0:
                assert j < n
                assert input_str[start] == old_surr_l
                assert input_str[j] == old_surr_r
                inner_content = input_str[start + 1:j]
                # Replace the content with new pattern
                result += new_inst + new_surr_l + inner_content + new_surr_r
                i = j + 1
                continue
            else:
                assert count >= 1
                assert j == n
                print("Warning: unbalanced surrogate pair in input string")
                result += new_inst + new_surr_l
                i = start + 1
                continue
        else:
            result += input_str[i:start]
            i = start

    if old_inst != new_inst and (old_inst + old_surr_l) in result:
        return change(result, old_inst, new_inst, old_surr_l, old_surr_r, new_surr_l, new_surr_r)
    else:
        return result


def find_substring_positions(string, substring):
    positions = [match.start() for match in re.finditer(re.escape(substring), string)]
    return positions


def rm_dollar_surr(content):
    pattern = re.compile(r'\\[a-zA-Z]+\$.*?\$|\$.*?\$')
    matches = pattern.findall(content)

    for match in matches:
        if not re.match(r'\\[a-zA-Z]+', match):
            new_match = match.strip('$')
            content = content.replace(match, ' ' + new_match + ' ')

    return content


def change_all(input_str, old_inst, new_inst, old_surr_l, old_surr_r, new_surr_l, new_surr_r):
    pos = find_substring_positions(input_str, old_inst + old_surr_l)
    res = list(input_str)
    for p in pos[::-1]:
        res[p:] = list(change(''.join(res[p:]), old_inst, new_inst, old_surr_l, old_surr_r, new_surr_l, new_surr_r))
    res = ''.join(res)
    return res


def to_katex(formula: str) -> str:
    res = formula
    # remove mbox surrounding
    res = change_all(res, r'\mbox ', r' ', r'{', r'}', r'', r'')
    res = change_all(res, r'\mbox', r' ', r'{', r'}', r'', r'')
    # remove hbox surrounding
    res = re.sub(r'\\hbox to ?-? ?\d+\.\d+(pt)?\{', r'\\hbox{', res)
    res = change_all(res, r'\hbox', r' ', r'{', r'}', r'', r' ')
    # remove raise surrounding
    res = re.sub(r'\\raise ?-? ?\d+\.\d+(pt)?', r' ', res)
    # remove makebox
    res = re.sub(r'\\makebox ?\[\d+\.\d+(pt)?\]\{', r'\\makebox{', res)
    res = change_all(res, r'\makebox', r' ', r'{', r'}', r'', r' ')
    # remove vbox surrounding, scalebox surrounding
    res = re.sub(r'\\raisebox\{-? ?\d+\.\d+(pt)?\}\{', r'\\raisebox{', res)
    res = re.sub(r'\\scalebox\{-? ?\d+\.\d+(pt)?\}\{', r'\\scalebox{', res)
    res = change_all(res, r'\scalebox', r' ', r'{', r'}', r'', r' ')
    res = change_all(res, r'\raisebox', r' ', r'{', r'}', r'', r' ')
    res = change_all(res, r'\vbox', r' ', r'{', r'}', r'', r' ')


    origin_instructions = [
        r'\Huge',
        r'\huge',
        r'\LARGE',
        r'\Large',
        r'\large',
        r'\normalsize',
        r'\small',
        r'\footnotesize',
        r'\tiny'
    ]
    for (old_ins, new_ins) in zip(origin_instructions, origin_instructions):
        res = change_all(res, old_ins, new_ins, r'$', r'$', '{', '}')
    res = change_all(res, r'\boldmath ', r'\bm', r'{', r'}', r'{', r'}')
    res = change_all(res, r'\boldmath', r'\bm', r'{', r'}', r'{', r'}')
    res = change_all(res, r'\boldmath ', r'\bm', r'$', r'$', r'{', r'}')
    res = change_all(res, r'\boldmath', r'\bm', r'$', r'$', r'{', r'}')
    res = change_all(res, r'\scriptsize', r'\scriptsize', r'$', r'$', r'{', r'}')
    res = change_all(res, r'\emph', r'\textit', r'{', r'}', r'{', r'}')
    res = change_all(res, r'\emph ', r'\textit', r'{', r'}', r'{', r'}')

    origin_instructions = [
        r'\left',
        r'\middle',
        r'\right',
        r'\big',
        r'\Big',
        r'\bigg',
        r'\Bigg',
        r'\bigl',
        r'\Bigl',
        r'\biggl',
        r'\Biggl',
        r'\bigm',
        r'\Bigm',
        r'\biggm',
        r'\Biggm',
        r'\bigr',
        r'\Bigr',
        r'\biggr',
        r'\Biggr'
    ]
    for origin_ins in origin_instructions:
        res = change_all(res, origin_ins, origin_ins, r'{', r'}', r'', r'')

    res = re.sub(r'\\\[(.*?)\\\]', r'\1\\newline', res)

    if res.endswith(r'\newline'):
        res = res[:-8]

    # remove multiple spaces
    res = re.sub(r'(\\,){1,}', ' ', res)
    res = re.sub(r'(\\!){1,}', ' ', res)
    res = re.sub(r'(\\;){1,}', ' ', res)
    res = re.sub(r'(\\:){1,}', ' ', res)
    res = re.sub(r'\\vspace\{.*?}', '', res)

    # merge consecutive text
    def merge_texts(match):
        texts = match.group(0)
        merged_content = ''.join(re.findall(r'\\text\{([^}]*)\}', texts))
        return f'\\text{{{merged_content}}}'
    res = re.sub(r'(\\text\{[^}]*\}\s*){2,}', merge_texts, res)

    res = res.replace(r'\bf ', '')
    res = rm_dollar_surr(res)

    # remove extra spaces (keeping only one)
    res = re.sub(r' +', ' ', res)

    return res.strip()


def inference_transform(images: List[Union[np.ndarray, Image.Image]]) -> List[torch.Tensor]:
    images = [np.array(img.convert('RGB')) if isinstance(img, Image.Image) else img for img in images]
    images = [trim_white_border(image) for image in images]
    images = [general_transform_pipeline(image) for image in  images]  # imgs: List[PIL.Image.Image]
    images = padding(images, FIXED_IMG_SIZE)
    return images

imgs = inference_transform([image])
```

```python
from transformers import VisionEncoderDecoderModel
mymodel = VisionEncoderDecoderModel.from_pretrained("OleehyO/TexTeller").eval()
```

```python
from transformers import RobertaTokenizerFast
tokenizer = RobertaTokenizerFast.from_pretrained("OleehyO/TexTeller")
```

#### Encoder Model

In an ideal world we would just be able to run `torch.jit.trace` directly on the model with the processed image: 

```python
encoder_model = mymodel.encoder
traced_model = torch.jit.trace(encoder_model, torch.stack(imgs))
```

```
/usr/local/lib/python3.10/dist-packages/transformers/modeling_utils.py:4713: FutureWarning: `_is_quantized_training_enabled` is going to be deprecated in transformers 4.39.0. Please use `model.hf_quantizer.is_trainable` instead
  warnings.warn(
/usr/local/lib/python3.10/dist-packages/transformers/models/vit/modeling_vit.py:163: TracerWarning: Converting a tensor to a Python boolean might cause the trace to be incorrect. We can't record the data flow of Python values, so this value will be treated as a constant in the future. This means that the trace might not generalize to other inputs!
  if num_channels != self.num_channels:
/usr/local/lib/python3.10/dist-packages/transformers/models/vit/modeling_vit.py:169: TracerWarning: Converting a tensor to a Python boolean might cause the trace to be incorrect. We can't record the data flow of Python values, so this value will be treated as a constant in the future. This means that the trace might not generalize to other inputs!
  if height != self.image_size[0] or width != self.image_size[1]:
---------------------------------------------------------------------------
RuntimeError                              Traceback (most recent call last)
<ipython-input-2-1f8652b4fe66> in <cell line: 2>()
      1 encoder_model = mymodel.encoder
----> 2 traced_model = torch.jit.trace(encoder_model, torch.stack(imgs))

2 frames
/usr/local/lib/python3.10/dist-packages/torch/jit/_trace.py in trace_module(mod, inputs, optimize, check_trace, check_inputs, check_tolerance, strict, _force_outplace, _module_class, _compilation_unit, example_inputs_is_kwarg, _store_inputs)
   1273             else:
   1274                 example_inputs = make_tuple(example_inputs)
-> 1275                 module._c._create_method_from_trace(
   1276                     method_name,
   1277                     func,

RuntimeError: Encountering a dict at the output of the tracer might cause the trace to be incorrect, this is only valid if the container structure does not change based on the module's inputs. Consider using a constant container instead (e.g. for `list`, use a `tuple` instead. for `dict`, use a `NamedTuple` instead). If you absolutely need this and know the side effects, pass strict=False to trace() to allow this behavior.
```

But, we run into a `RuntimeError` that says the trace function does not like a dictionary output since there is no guarantee that the same keys will be returned every time. We can pass `strict=False` but there is a better solution.

```python
from collections import namedtuple

encoder_model = mymodel.encoder
EncoderOutput = namedtuple("EncoderOutput", encoder_model.forward(torch.stack(imgs)).keys())

class EncoderWrapper(torch.nn.Module):
    def __init__(self, encoder):
        super().__init__()
        self.encoder = encoder

    def forward(self, pixel_values):
        output = self.encoder(pixel_values)
        return EncoderOutput(**output)

wrapped_encoder_model = EncoderWrapper(encoder_model)
traced_model = torch.jit.trace(wrapped_encoder_model, torch.stack(imgs))
```

This can then be exported to a CoreML model directly.

```python
import coremltools as ct

coreml_encoder_model = ct.convert(
    traced_model,
    inputs=[ct.TensorType(name="pixel_values", shape=torch.stack(imgs).shape)]
 )

coreml_encoder_model.save("encoder.mlpackage")
```

In Python, this can be used to generate the last hidden state by running:

```python
encoder_hidden_states = coreml_encoder_model.predict({"pixel_values": imgs})['hidden_states']
```

#### Decoder Model

This is where things get tricky. When running the model directly we do not have to keep track of the shape for the decoder ids, but `torch.jit.trace` requires the input shapes to be static so it can do its magic tracing the model. This is where the padding trick comes to play. The TrOCR model implementation states that the attention mask is automatically calculated if it is not passed to the model, which means we can ignore it for now.

We can't also simply have an `if len(input_id) < max_length` because the `trace()` function does not work with Python boolean logic. 

```python
decoder = mymodel.decoder.eval()

max_decoder_length = 100

input_ids = torch.randint(3, mymodel.config.decoder.vocab_size, (1, 80))
input_ids[0][0] = tokenizer.bos_token_id

encoder_hidden_states = torch.randn(1, 785, 768)  # Example encoder_hidden_states which matches the shape of the encoder's output

def pad_input_ids(input_ids, max_length, pad_token_id):
    input_ids = torch.nn.functional.pad(input_ids, (0, max_length - input_ids.size(1)), 'constant', pad_token_id)
    return input_ids

class DecoderWrapper(torch.nn.Module):
    def __init__(self, traced_decoder):
        super().__init__()
        self.traced_decoder = traced_decoder

    def forward(self, input_ids=None, encoder_hidden_states=None):
        correct_inputs = input_ids[input_ids != 1]
        correct_inputs_reshaped = correct_inputs.unsqueeze(0)
        return self.traced_decoder(
            input_ids=correct_inputs_reshaped,
            encoder_hidden_states=encoder_hidden_states,
            use_cache=False,
        )['logits']

wrapped_decoder = DecoderWrapper(decoder)

input_ids = pad_input_ids(input_ids, max_decoder_length, tokenizer.pad_token_id)

traced_decoder = torch.jit.trace(wrapped_decoder, (input_ids, encoder_hidden_states))
```

I did realise afterwards that I could have simplified the `pad_input_ids` function since we are not tracing it. Oh well!


The `use_cache` flag controls whether the model outputs past key values which can the be passed to the next run which does speed up things a bit but is a bit beyond the scope of this post. 

```python
coreml_decoder_model = ct.convert(
    traced_decoder.eval(),
    minimum_deployment_target=ct.target.iOS14, # Fixes issue with the CoreML Tools version I was using 
    inputs=[
        ct.TensorType(
            name="input_ids", 
            shape=input_ids.shape, 
            dtype=int
        ),
        ct.TensorType(
            name="last_hidden_state", shape=encoder_hidden_states.shape
        )
    ],
    outputs=[ct.TensorType(name='logits')]
 )
```

To use it for prediction:

```python
start_token_id = tokenizer.cls_token_id
decoder_input_ids = torch.tensor([[start_token_id]], dtype=torch.int32)
max_length = 100
decoded_token_ids = []

encoder_output = coreml_encoder_model.predict({"pixel_values": imgs})['hidden_states']

for _ in range(max_length):
    logits = coreml_decoder_model.predict({
        "input_ids": pad_input_ids(decoder_input_ids, max_decoder_length, tokenizer.pad_token_id).unsqueeze(0),
        "last_hidden_state": encoder_output
    })['logits']
    next_token_id = np.argmax(logits, axis=-1)[0,-1]
    if next_token_id == tokenizer.eos_token_id:
        break
    decoder_input_ids = torch.cat([decoder_input_ids, torch.tensor([[next_token_id]], dtype=torch.int32)], dim=1)
    decoded_token_ids.append(next_token_id)

output_text = tokenizer.decode(decoded_token_ids, skip_special_tokens=True)
print(f"Generated Text: {output_text}")
```

## What about the tokenizer?

The tokenizer class `RobertaTokenizerFast` for the model is a specialized fast tokenization implementation that uses the Byte-Pair Encoding (BPE), but a more "fast" implementation. For our use case, we can create a simple implementation in Python using the vocabulary and tokenizer config file for the model. (Swift implementation in the next section)

```python
import json
import re

class MyTokenizer:
    def __init__(self, vocab_file, tokenizer_file):
        with open(vocab_file, 'r', encoding='utf-8') as f:
            self.vocab = json.load(f)
        
        with open(tokenizer_file, 'r', encoding='utf-8') as f:
            self.tokenizer_config = json.load(f)
        
        self.id_to_token = {v: k for k, v in self.vocab.items()}

        self.special_tokens = self.tokenizer_config.get('added_tokens', [])
        self.cls_token_id = self.vocab.get('<s>')
        self.sep_token_id = self.vocab.get('</s>')
        self.pad_token_id = self.vocab.get('<pad>')
        self.unk_token_id = self.vocab.get('<unk>')

    def encode(self, text):
        tokens = self._tokenize(text)
        token_ids = [self.vocab.get(token, self.unk_token_id) for token in tokens]
        return token_ids

    def decode(self, token_ids, skip_special_tokens = True):
        tokens = [self.id_to_token.get(token_id, self.id_to_token[self.unk_token_id]) for token_id in token_ids]
        if skip_special_tokens:
            tokens = [token for token in tokens if token not in self.special_tokens and token != '</s>']
        # Replace 'Ġ' with a space to handle RoBERTa's special space tokenization
        decoded_string = self._convert_tokens_to_string(tokens)
        return decoded_string

    def _convert_tokens_to_string(self, tokens):
        text = ''.join(tokens).replace('Ġ', ' ')
        text = re.sub(r'\s([?.!,\'"](?:\s|$))', r'\1', text)
        return text.strip()


    def _tokenize(self, text) :
        text = self._clean_text(text)
        words = re.findall(r'\w+|\S', text)
        tokens = []
        for word in words:
            tokens.extend(self._bpe_encode(word))
        return tokens

    def _bpe_encode(self, word):
        if word in self.vocab:
            return [word]
        chars = list(word)
        for i in range(len(chars) - 1):
            pair = chars[i] + chars[i + 1]
            if pair in self.vocab:
                chars[i] = pair
                del chars[i + 1]
        return chars

    def _clean_text(self, text):
        text = text.strip()
        return text
```

Now, we can replace the last call that we use to generate text with

```python
output_text = MyTokenizer("./exported/vocab.json", "./exported/tokenizer.json").decode(decoded_token_ids, skip_special_tokens=True)
print(f"Generated Text: {output_text}")
```

## Let's bring it all together

These code snippets were used in an Xcode macOS app, but can be easily converted to be used in other projects. `decoder_model.onnx`, `encoder_model.onnx`, `vocab.json`, and `tokenizer.json` were copied from the `exported` directory after exporting using `optimum-cli`. The CoreML models can be exported and import similarly.

### Image Processing

Do note that this, and the next section are very specific to the input processing required for the TexTeller model.

```swift
// ImageUtils.swift

import Foundation
import CoreImage
import AppKit

let IMAGE_MEAN: CGFloat = 0.9545467
let IMAGE_STD: CGFloat = 0.15394445
let FIXED_IMG_SIZE: CGFloat = 448
let IMG_CHANNELS: Int = 1
let MIN_HEIGHT: CGFloat = 12
let MIN_WIDTH: CGFloat = 30

func loadImage(from urlString: String) -> NSImage? {
    guard let url = URL(string: urlString), let imageData = try? Data(contentsOf: url) else {
        return nil
    }
    return NSImage(data: imageData)
}

func nsImageToCIImage(_ image: NSImage) -> CIImage? {
    guard let data = image.tiffRepresentation,
          let bitmapImage = NSBitmapImageRep(data: data),
          let cgImage = bitmapImage.cgImage else {
        return nil
    }
    return CIImage(cgImage: cgImage)
}

func trimWhiteBorder(image: CIImage) -> CIImage? {
    let context = CIContext()
    guard let cgImage = context.createCGImage(image, from: image.extent) else {
        return nil
    }
    
    let width = cgImage.width
    let height = cgImage.height
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bytesPerPixel = 4
    let bytesPerRow = bytesPerPixel * width
    let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue
    var pixelData = [UInt8](repeating: 0, count: height * bytesPerRow)

    guard let contextRef = CGContext(
        data: &pixelData,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: bytesPerRow,
        space: colorSpace,
        bitmapInfo: bitmapInfo
    ) else {
        return nil
    }
    
    contextRef.draw(cgImage, in: CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height)))

    let whitePixel: [UInt8] = [255, 255, 255, 255]
    
    var minX = width
    var minY = height
    var maxX: Int = 0
    var maxY: Int = 0
    
    for y in 0..<height {
        for x in 0..<width {
            let pixelIndex = (y * bytesPerRow) + (x * bytesPerPixel)
            let pixel = Array(pixelData[pixelIndex..<(pixelIndex + 4)])
            
            if pixel != whitePixel {
                if x < minX { minX = x }
                if x > maxX { maxX = x }
                if y < minY { minY = y }
                if y > maxY { maxY = y }
            }
        }
    }
    
    if minX == width || minY == height || maxX == 0 || maxY == 0 {
        return image
    }

    let croppedRect = CGRect(x: CGFloat(minX), y: CGFloat(minY), width: CGFloat(maxX - minX), height: CGFloat(maxY - minY))
    return image.cropped(to: croppedRect)
}
func addWhiteBorder(to image: CIImage, maxSize: CGFloat) -> CIImage {
    let randomPadding = (0..<4).map { _ in CGFloat(arc4random_uniform(UInt32(maxSize))) }
    var xPadding = randomPadding[0] + randomPadding[2]
    var yPadding = randomPadding[1] + randomPadding[3]
    
    if xPadding + image.extent.width < MIN_WIDTH {
        let compensateWidth = (MIN_WIDTH - (xPadding + image.extent.width)) * 0.5 + 1
        xPadding += compensateWidth
    }
    if yPadding + image.extent.height < MIN_HEIGHT {
        let compensateHeight = (MIN_HEIGHT - (yPadding + image.extent.height)) * 0.5 + 1
        yPadding += compensateHeight
    }
    
    let padFilter = CIFilter(name: "CICrop")!
    let paddedRect = CGRect(x: image.extent.origin.x - randomPadding[0],
                            y: image.extent.origin.y - randomPadding[1],
                            width: image.extent.width + xPadding,
                            height: image.extent.height + yPadding)
    padFilter.setValue(image, forKey: kCIInputImageKey)
    padFilter.setValue(CIVector(cgRect: paddedRect), forKey: "inputRectangle")
    
    return padFilter.outputImage ?? image
}

func padding(images: [CIImage], requiredSize: CGFloat) -> [CIImage] {
    return images.map { image in
        let widthPadding = requiredSize - image.extent.width
        let heightPadding = requiredSize - image.extent.height
        return addWhiteBorder(to: image, maxSize: max(widthPadding, heightPadding))
    }
}

func inferenceTransform(images: [NSImage]) -> [CIImage] {
    let ciImages = images.compactMap { nsImageToCIImage($0) }
    
    let trimmedImages = ciImages.compactMap { trimWhiteBorder(image: $0) }
    let paddedImages = padding(images: trimmedImages, requiredSize: FIXED_IMG_SIZE)
    
    return paddedImages
}

func ciImageToFloatArray(_ image: CIImage, size: CGSize) -> [Float] {
    let context = CIContext()
    guard let cgImage = context.createCGImage(image, from: image.extent) else {
        return []
    }

    let width = Int(size.width)
    let height = Int(size.height)
    var pixelData = [UInt8](repeating: 0, count: width * height) 
    let colorSpace = CGColorSpaceCreateDeviceGray()
    guard let contextRef = CGContext(
        data: &pixelData,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: width,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.none.rawValue
    ) else {
        return []
    }

    contextRef.draw(cgImage, in: CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height)))
    return pixelData.map { Float($0) / 255.0 }
}

```

### KaTeX Utils

Just some basic regex stuff ported to Swift

```swift
// KatexUtils.swift

import Foundation

func change(_ inputStr: String, oldInst: String, newInst: String, oldSurrL: Character, oldSurrR: Character, newSurrL: String, newSurrR: String) -> String {
    var result = ""
    var i = 0
    let n = inputStr.count
    let inputArray = Array(inputStr) 
    while i < n {
        if i + oldInst.count <= n && inputStr[inputStr.index(inputStr.startIndex, offsetBy: i)..<inputStr.index(inputStr.startIndex, offsetBy: i + oldInst.count)] == oldInst {
            let start = i + oldInst.count
            if start < n && inputArray[start] == oldSurrL {
                var count = 1
                var j = start + 1
                var escaped = false

                while j < n && count > 0 {
                    if inputArray[j] == "\\" && !escaped {
                        escaped = true
                        j += 1
                        continue
                    }

                    if inputArray[j] == oldSurrR && !escaped {
                        count -= 1
                        if count == 0 {
                            break
                        }
                    } else if inputArray[j] == oldSurrL && !escaped {
                        count += 1
                    }

                    escaped = false
                    j += 1
                }

                if count == 0 {
                    let innerContent = String(inputArray[(start + 1)..<j])
                    result += newInst + newSurrL + innerContent + newSurrR
                    i = j + 1
                    continue
                } else {
                    result += newInst + newSurrL
                    i = start + 1
                    continue
                }
            }
        }
        result.append(inputArray[i])
        i += 1
    }

    if oldInst != newInst && result.contains(oldInst + String(oldSurrL)) {
        return change(result, oldInst: oldInst, newInst: newInst, oldSurrL: oldSurrL, oldSurrR: oldSurrR, newSurrL: newSurrL, newSurrR: newSurrR)
    }

    return result
}


func findSubstringPositions(_ string: String, substring: String) -> [Int] {
    var positions: [Int] = []
    var searchRange = string.startIndex..<string.endIndex

    while let range = string.range(of: substring, options: [], range: searchRange) {
        let position = string.distance(from: string.startIndex, to: range.lowerBound)
        positions.append(position)
        searchRange = range.upperBound..<string.endIndex
    }

    return positions
}

func rmDollarSurr(content: String) -> String {
    let pattern = try! NSRegularExpression(pattern: "\\\\[a-zA-Z]+\\$.*?\\$|\\$.*?\\$", options: [])
    var newContent = content
    let matches = pattern.matches(in: content, options: [], range: NSRange(content.startIndex..<content.endIndex, in: content))

    for match in matches.reversed() {
        let matchedString = (content as NSString).substring(with: match.range)
        if !matchedString.starts(with: "\\") {
            let strippedMatch = matchedString.replacingOccurrences(of: "$", with: "")
            newContent = newContent.replacingOccurrences(of: matchedString, with: " \(strippedMatch) ")
        }
    }

    return newContent
}

func changeAll(inputStr: String, oldInst: String, newInst: String, oldSurrL: Character, oldSurrR: Character, newSurrL: String, newSurrR: String) -> String {
    let positions = findSubstringPositions(inputStr, substring: oldInst + String(oldSurrL))
    var result = inputStr

    for pos in positions.reversed() {
        let startIndex = result.index(result.startIndex, offsetBy: pos)
        let substring = String(result[startIndex..<result.endIndex])
        let changedSubstring = change(substring, oldInst: oldInst, newInst: newInst, oldSurrL: oldSurrL, oldSurrR: oldSurrR, newSurrL: newSurrL, newSurrR: newSurrR)
        result.replaceSubrange(startIndex..<result.endIndex, with: changedSubstring)
    }

    return result
}

func toKatex(formula: String) -> String {
    var res = formula
    res = changeAll(inputStr: res, oldInst: "\\mbox ", newInst: " ", oldSurrL: "{", oldSurrR: "}", newSurrL: "", newSurrR: "")
    res = changeAll(inputStr: res, oldInst: "\\mbox", newInst: " ", oldSurrL: "{", oldSurrR: "}", newSurrL: "", newSurrR: "")
    res = res.replacingOccurrences(of: "\\[", with: "")
    res = res.replacingOccurrences(of: "\\]", with: "")
    res = res.replacingOccurrences(of: "\\\\[?.!,\'\"](?:\\s|$)", with: "", options: .regularExpression)
    res = rmDollarSurr(content: res)
    res = res.replacingOccurrences(of: " +", with: " ", options: .regularExpression)

    return res.trimmingCharacters(in: .whitespacesAndNewlines)
}
```

### Tokenizer

```swift
// RobertaTokenizerFast.swift
// I don't think this is very fast -\_

import Foundation

class RobertaTokenizerFast {
    var vocab: [String: Int] = [:]
    var idToToken: [Int: String] = [:]
    var specialTokens: [String] = []
    var unkTokenId: Int?

    init(vocabFile: String, tokenizerFile: String) {
        if let vocabURL = Bundle.main.url(forResource: vocabFile, withExtension: "json"),
           let vocabData = try? Data(contentsOf: vocabURL),
           let vocabDict = try? JSONSerialization.jsonObject(with: vocabData, options: []) as? [String: Int] {
            self.vocab = vocabDict
        }

        if let tokenizerURL = Bundle.main.url(forResource: tokenizerFile, withExtension: "json"),
           let tokenizerData = try? Data(contentsOf: tokenizerURL),
           let tokenizerConfig = try? JSONSerialization.jsonObject(with: tokenizerData, options: []) as? [String: Any] {
            self.specialTokens = tokenizerConfig["added_tokens"] as? [String] ?? []
        }

        self.idToToken = vocab.reduce(into: [Int: String]()) { $0[$1.value] = $1.key }

        self.unkTokenId = vocab["<unk>"]
    }

    func encode(text: String) -> [Int] {
        let tokens = tokenize(text)
        return tokens.map { vocab[$0] ?? unkTokenId! }
    }

    func decode(tokenIds: [Int], skipSpecialTokens: Bool = true) -> String {
        let tokens = tokenIds.compactMap { idToToken[$0] }
        let filteredTokens = skipSpecialTokens ? tokens.filter { !specialTokens.contains($0) && $0 != "</s>" } : tokens
        return convertTokensToString(filteredTokens)
    }

    private func tokenize(_ text: String) -> [String] {
        let cleanedText = cleanText(text)
        let words = cleanedText.split(separator: " ").map { String($0) }
        
        var tokens: [String] = []
        for word in words {
            tokens.append(contentsOf: bpeEncode(word))
        }
        return tokens
    }

    private func bpeEncode(_ word: String) -> [String] {
        if vocab.keys.contains(word) {
            return [word]
        }

        let chars = Array(word)
        var tokens: [String] = []
        var i = 0

        while i < chars.count {
            if i < chars.count - 1 {
                let pair = String(chars[i]) + String(chars[i + 1])
                if vocab.keys.contains(pair) {
                    tokens.append(pair)
                    i += 2
                    continue
                }
            }
            tokens.append(String(chars[i]))
            i += 1
        }
        return tokens
    }

    private func cleanText(_ text: String) -> String {
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func convertTokensToString(_ tokens: [String]) -> String {
        let text = tokens.joined().replacingOccurrences(of: "Ġ", with: " ")
        return text.replacingOccurrences(of: "\\s([?.!,\'\"](?:\\s|$))", with: "$1", options: .regularExpression, range: nil).trimmingCharacters(in: .whitespaces)
    }
}

```


### On it with ONNX

```swift
import OnnxRuntimeBindings

public enum ModelError: Error {
    case encoderModelNotFound
    case decoderModelNotFound
    case imageError
}

public struct TexTellerModel {
    public let encoderSession: ORTSession
    public let decoderSession: ORTSession
    private let tokenizer: RobertaTokenizerFast
    
    public init() throws {
        guard let encoderModelPath = Bundle.main.path(forResource: "encoder_model", ofType: "onnx") else {
            print("Encoder model not found...")
            throw ModelError.encoderModelNotFound
        }
        guard let decoderModelPath = Bundle.main.path(forResource: "decoder_model", ofType: "onnx") else {
            print("Decoder model not found...")
            throw ModelError.decoderModelNotFound
        }
        let env = try ORTEnv(loggingLevel: .warning)
        let coreMLOptions = ORTCoreMLExecutionProviderOptions()
        coreMLOptions.enableOnSubgraphs = true
        coreMLOptions.createMLProgram = false
        let options = try ORTSessionOptions()
        // Uncomment below to use CoreML
        //try options.appendCoreMLExecutionProvider(with: coreMLOptions)
        encoderSession = try ORTSession(env: env, modelPath: encoderModelPath, sessionOptions: options)
        decoderSession = try ORTSession(env: env, modelPath: decoderModelPath, sessionOptions: options)
        
        self.tokenizer = RobertaTokenizerFast(vocabFile: "vocab", tokenizerFile: "tokenizer")
    }
    
    public func texIt(_ image: NSImage, rawString: Bool = false) throws -> String {
        let transformedImage = inferenceTransform(images: [image])
        if let firstTransformedImage = transformedImage.first {
            let pixelValues = ciImageToFloatArray(firstTransformedImage, size: CGSize(width: FIXED_IMG_SIZE, height: FIXED_IMG_SIZE))
            let inputTensor = try ORTValue(
                tensorData: NSMutableData(
                    data: Data(bytes: pixelValues, count: pixelValues.count * MemoryLayout<Float>.stride)
                    ),
                elementType: .float,
                shape: [
                    1, 1, NSNumber(value: FIXED_IMG_SIZE), NSNumber(value: FIXED_IMG_SIZE)
                ]
            )
            let encoderInput: [String: ORTValue] = [
                "pixel_values": inputTensor
            ]
            let encoderOutputNames = try self.encoderSession.outputNames()
            let encoderOutputs: [String: ORTValue] = try self.encoderSession.run(
                withInputs: encoderInput,
                outputNames: Set(encoderOutputNames),
                runOptions: nil
            )
           
            var decodedTokenIds: [Int] = []
            let startTokenId = 0 
            let endTokenId = 2
            let maxDecoderLength: Int = 100
            var decoderInputIds: [Int] = [startTokenId]
            let vocabSize = 15000
            
            let decoderOutputNames = try self.decoderSession.outputNames()
            
            for step in 0..<maxDecoderLength {
                let decoderInputIdsTensor = try ORTValue(
                    tensorData: NSMutableData(data: Data(bytes: decoderInputIds, count: decoderInputIds.count * MemoryLayout<Int64>.stride)),
                    elementType: .int64,
                    shape: [1, NSNumber(value: decoderInputIds.count)]
                )
                let decoderInputs: [String: ORTValue] = [
                    "input_ids": decoderInputIdsTensor,
                    "encoder_hidden_states": encoderOutputs["last_hidden_state"]!
                ]
                let decoderOutputs: [String: ORTValue] = try self.decoderSession.run(withInputs: decoderInputs, outputNames: Set(decoderOutputNames), runOptions: nil)
                let logitsTensor = decoderOutputs["logits"]!
                let logitsData = try logitsTensor.tensorData() as Data
                let logits = logitsData.withUnsafeBytes {
                    Array(UnsafeBufferPointer<Float>(
                        start: $0.baseAddress!.assumingMemoryBound(to: Float.self),
                        count: logitsData.count / MemoryLayout<Float>.stride
                    ))
                }
                let sequenceLength = decoderInputIds.count
                let startIndex = (sequenceLength - 1) * vocabSize
                let endIndex = startIndex + vocabSize
                let lastTokenLogits = Array(logits[startIndex..<endIndex])
                let nextTokenId = lastTokenLogits.enumerated().max(by: { $0.element < $1.element})?.offset ?? 9 // TODO: Should I track if this fails

                if nextTokenId == endTokenId {
                    break
                }
                decodedTokenIds.append(nextTokenId)
                decoderInputIds.append(nextTokenId)
            }
            
            if rawString {
                return tokenizer.decode(tokenIds: decodedTokenIds)
            }
            
            return toKatex(formula: tokenizer.decode(tokenIds: decodedTokenIds))
        }
        throw ModelError.imageError
    }
}
```

### CoreML's Version

The above class can be modified to use CoreML instead.

```swift
import Foundation
import CoreML
import AppKit

func argmax(_ multiArray: MLMultiArray) -> Int? {
    guard multiArray.dataType == .float32 else {
        print("MLMultiArray is not of type Float32.")
        return nil
    }
    
    var maxIndex: Int? = nil
    var maxValue: Float = -Float.infinity
    
    for i in 0..<multiArray.count {
        let value = multiArray[i].floatValue       
        if value > maxValue {
            maxValue = value
            maxIndex = i
        }
    }
    
    return maxIndex
}

public struct TexTellerCoreMLModel {
    private let encoderModel: encoder
    private let decoderModel: decoder
    private let tokenizer: RobertaTokenizerFast
    
    public init() throws {
        self.encoderModel = try encoder(configuration: .init())
        self.decoderModel = try decoder(configuration: .init())
        self.tokenizer = RobertaTokenizerFast(vocabFile: "vocab", tokenizerFile: "tokenizer")
    }
    
    public func texIt(_ image: NSImage, rawString: Bool = false) throws -> String {
        let transformedImage = inferenceTransform(images: [image])
        if let firstTransformedImage = transformedImage.first {
            let pixelValues = ciImageToFloatArray(firstTransformedImage, size: CGSize(width: FIXED_IMG_SIZE, height: FIXED_IMG_SIZE))
            
            guard let multiArray = try? MLMultiArray(shape: [1,1,NSNumber(value: FIXED_IMG_SIZE), NSNumber(value: FIXED_IMG_SIZE)], dataType: .float32) else {
                throw ModelError.imageError
            }

            for i in 0..<pixelValues.count {
                multiArray[i] = NSNumber(value: pixelValues[i])
            }

            let prediction = try self.encoderModel.prediction(pixel_values: multiArray)
            
            var decodedTokenIds: [Int] = []
            let startTokenId = 0
            let endTokenId = 2
            let maxDecoderLength: Int = 100
            var decoderInputIds: [Int] = [startTokenId]
            let vocabSize = 15000
            

            guard var tokenIdsArray = try? MLMultiArray(shape: [1,100], dataType: .float32) else {
                throw ModelError.imageError
            }
            for i in 0..<100 {
                tokenIdsArray[i] = 1
            }
            tokenIdsArray[0] = 0

            var count = 1
            
            func argmax(_ multiArray: MLMultiArray, vocabSize: Int) -> Int? {
                var maxIndex: Int = 0
                var maxValue: Float = -Float.infinity
                
                for i in 0..<vocabSize {
                    let value = Float(truncating: multiArray[i])
                    if value > maxValue {
                        maxValue = value
                        maxIndex = i
                    }
                }
                return maxIndex
            }

            for i in 0..<32 {
                print("my input is \(tokenIdsArray)")
                let owo = try self.decoderModel.prediction(input_ids: tokenIdsArray, last_hidden_state: prediction.hidden_states)
                print(owo.logits.shape)
                print("got something")
                // lastTokenLogits.enumerated().max(by: { $0.element < $1.element})?.offset ?? 9
                if let nextToken = argmax(owo.logits, vocabSize: vocabSize) {
                        print("Next token index is \(nextToken)")
                    if nextToken == endTokenId {
                        print("Found eos token")
                        break
                    }
                    tokenIdsArray[i+1] = NSNumber(integerLiteral: nextToken)
                    decodedTokenIds.append(nextToken)
                    } else {
                        print("Failed to find the argmax.")
                    }
            }

            
            if rawString {
                return tokenizer.decode(tokenIds: decodedTokenIds)
            }
            
            return toKatex(formula: tokenizer.decode(tokenIds: decodedTokenIds))
            
        }
        throw ModelError.imageError
    }
    
}
```

### Run 'em

To use the ONNX version:

```swift
do {
    let mymodel = try await TexTellerModel()
    if let myimage = loadImage("https://miro.medium.com/v2/resize:fit:1400/1*OReJHtogeA62SmSwzNzgvw.png") {
        do {
            let latex = try mymodel.texIt(myimage)
        } catch {
            print("Uh oh")
        }
    } else {
        print("Failed to load the image")
    }
} catch {
    print("Error :( \(error)")
}
```

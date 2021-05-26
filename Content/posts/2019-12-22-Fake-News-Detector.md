---
date: 2019-12-22 11:10
description: In this tutorial we will build a fake news detecting app from scratch, using Turicreate for the machine learning model and SwiftUI for building the app
tags: Tutorial, Colab, SwiftUI, Turicreate
---


# Building a Fake News Detector with Turicreate

**In this tutorial we will build a fake news detecting app from scratch, using Turicreate for the machine learning model and SwiftUI for building the app**


Note: These commands are written as if you are running a jupyter notebook.

## Building the Machine Learning Model

### Data Gathering

To build a classifier, you need a lot of data. George McIntire (GH: @joolsa) has created a wonderful dataset containing the headline, body and whether it is fake or real.
Whenever you are looking for a dataset, always try searching on Kaggle and GitHub before you start building your own

### Dependencies

I used a Google Colab instance for training my model.  If you also plan on using Google Colab then I recommend choosing a GPU Instance (It is Free)
This allows you to train the model on the GPU. Turicreate is built on top of Apache's MXNet Framework, for us to use GPU we need to install
a CUDA compatible MXNet package.

```Termcap
!pip install turicreate
!pip uninstall -y mxnet
!pip install mxnet-cu100==1.4.0.post0
```

If you do not wish to train on GPU or are running it on your computer, you can ignore the last two lines

### Downloading the Dataset

```Termcap
!wget -q "https://github.com/joolsa/fake_real_news_dataset/raw/master/fake_or_real_news.csv.zip"
!unzip fake_or_real_news.csv.zip
```

### Model Creation

```python
import turicreate as tc
tc.config.set_num_gpus(-1) # If you do not wish to use GPUs, set it to 0
```

```python
dataSFrame = tc.SFrame('fake_or_real_news.csv')
```

The dataset contains a column named "X1", which is of no use to us. Therefore, we simply drop it

```python
dataSFrame.remove_column('X1')
```

#### Splitting Dataset

```python
train, test = dataSFrame.random_split(.9)
```

#### Training

```python
model = tc.text_classifier.create(
    dataset=train,
    target='label',
    features=['title','text']
)
```

```python
+-----------+----------+-----------+--------------+-------------------+---------------------+
| Iteration | Passes   | Step size | Elapsed Time | Training Accuracy | Validation Accuracy |
+-----------+----------+-----------+--------------+-------------------+---------------------+
| 0         | 2        | 1.000000  | 1.156349     | 0.889680          | 0.790036            |
| 1         | 4        | 1.000000  | 1.359196     | 0.985952          | 0.918149            |
| 2         | 6        | 0.820091  | 1.557205     | 0.990260          | 0.914591            |
| 3         | 7        | 1.000000  | 1.684872     | 0.998689          | 0.925267            |
| 4         | 8        | 1.000000  | 1.814194     | 0.999063          | 0.925267            |
| 9         | 14       | 1.000000  | 2.507072     | 1.000000          | 0.911032            |
+-----------+----------+-----------+--------------+-------------------+---------------------+
```

### Testing the Model

```python
est_predictions = model.predict(test)
accuracy = tc.evaluation.accuracy(test['label'], test_predictions)
print(f'Topic classifier model has a testing accuracy of {accuracy*100}% ', flush=True)
```

```python
Topic classifier model has a testing accuracy of 92.3076923076923%
```

We have just created our own Fake News Detection Model which has an accuracy of 92%!

```python
example_text = {"title": ["Middling ‘Rise Of Skywalker’ Review Leaves Fan On Fence About Whether To Threaten To Kill Critic"], "text": ["Expressing ambivalence toward the relatively balanced appraisal of the film, Star Wars fan Miles Ariely admitted Thursday that an online publication’s middling review of The Rise Of Skywalker had left him on the fence about whether he would still threaten to kill the critic who wrote it. “I’m really of two minds about this, because on the one hand, he said the new movie fails to live up to the original trilogy, which makes me at least want to throw a brick through his window with a note telling him to watch his back,” said Ariely, confirming he had already drafted an eight-page-long death threat to Stan Corimer of the website Screen-On Time, but had not yet decided whether to post it to the reviewer’s Facebook page. “On the other hand, though, he commended J.J. Abrams’ skillful pacing and faithfulness to George Lucas’ vision, which makes me wonder if I should just call the whole thing off. Now, I really don’t feel like camping outside his house for hours. Maybe I could go with a response that’s somewhere in between, like, threatening to kill his dog but not everyone in his whole family? I don’t know. This is a tough one.” At press time, sources reported that Ariely had resolved to wear his Ewok costume while he murdered the critic in his sleep."]}
example_prediction = model.classify(tc.SFrame(example_text))
print(example_prediction, flush=True)
```

```python
+-------+--------------------+
| class |    probability     |
+-------+--------------------+
|  FAKE | 0.9245648658345308 |
+-------+--------------------+
[1 rows x 2 columns]
```

### Exporting the Model

```python
model_name = 'FakeNews'
coreml_model_name = model_name + '.mlmodel'
exportedModel = model.export_coreml(coreml_model_name)
```

**Note: To download files from Google Colab, simply click on the files section in the sidebar, right click on filename and then click on download**

[Link to Colab Notebook](https://colab.research.google.com/drive/1onMXGkhA__X2aOFdsoVL-6HQBsWQhOP4)

## Building the App using SwiftUI

### Initial Setup

First we create a single view app (make sure you check the use SwiftUI button)

Then we copy our .mlmodel file to our project (Just drag and drop the file in the XCode Files Sidebar)

Our ML Model does not take a string directly as an input, rather it takes bag of words as an input.
DescriptionThe bag-of-words model is a simplifying representation used in NLP, in this text is represented as a bag of words, without any regard for grammar or order, but noting multiplicity

We define our bag of words function


```swift
func bow(text: String) -> [String: Double] {
        var bagOfWords = [String: Double]()
        
        let tagger = NSLinguisticTagger(tagSchemes: [.tokenType], options: 0)
        let range = NSRange(location: 0, length: text.utf16.count)
        let options: NSLinguisticTagger.Options = [.omitPunctuation, .omitWhitespace]
        tagger.string = text
        
        tagger.enumerateTags(in: range, unit: .word, scheme: .tokenType, options: options) { _, tokenRange, _ in
            let word = (text as NSString).substring(with: tokenRange)
            if bagOfWords[word] != nil {
                bagOfWords[word]! += 1
            } else {
                bagOfWords[word] = 1
            }
        }
        
        return bagOfWords
    }
```


We also declare our variables

```swift
@State private var title: String = ""
@State private var headline: String = ""
@State private var alertTitle = ""
@State private var alertText = ""
@State private var showingAlert = false
```

Finally, we implement a simple function which reads the two text fields, creates their bag of words representation and displays an alert with the appropriate result



**Complete Code**


```swift
import SwiftUI

struct ContentView: View {
    @State private var title: String = ""
    @State private var headline: String = ""
    
    @State private var alertTitle = ""
    @State private var alertText = ""
    @State private var showingAlert = false
    
    var body: some View {
        NavigationView {
            VStack(alignment: .leading) {
                Text("Headline").font(.headline)
                TextField("Please Enter Headline", text: $title)
                    .lineLimit(nil)
                Text("Body").font(.headline)
                TextField("Please Enter the content", text: $headline)
                .lineLimit(nil)
            }
                .navigationBarTitle("Fake News Checker")
            .navigationBarItems(trailing:
                Button(action: classifyFakeNews) {
                    Text("Check")
                })
            .padding()
                .alert(isPresented: $showingAlert){
                    Alert(title: Text(alertTitle), message: Text(alertText), dismissButton: .default(Text("OK")))
            }
        }
        
    }
    
    func classifyFakeNews(){
        let model = FakeNews()
        let myTitle = bow(text: title)
        let myText = bow(text: headline)
        do {
            let prediction = try model.prediction(title: myTitle, text: myText)
            alertTitle = prediction.label
            alertText = "It is likely that this piece of news is \(prediction.label.lowercased())."
            print(alertText)
        } catch {
            alertTitle = "Error"
            alertText = "Sorry, could not classify if the input news was fake or not."
        }
        
        showingAlert = true
    }
    func bow(text: String) -> [String: Double] {
        var bagOfWords = [String: Double]()
        
        let tagger = NSLinguisticTagger(tagSchemes: [.tokenType], options: 0)
        let range = NSRange(location: 0, length: text.utf16.count)
        let options: NSLinguisticTagger.Options = [.omitPunctuation, .omitWhitespace]
        tagger.string = text
        
        tagger.enumerateTags(in: range, unit: .word, scheme: .tokenType, options: options) { _, tokenRange, _ in
            let word = (text as NSString).substring(with: tokenRange)
            if bagOfWords[word] != nil {
                bagOfWords[word]! += 1
            } else {
                bagOfWords[word] = 1
            }
        }
        
        return bagOfWords
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

```


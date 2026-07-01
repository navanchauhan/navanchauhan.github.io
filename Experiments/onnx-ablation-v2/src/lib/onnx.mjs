import { readFile } from 'node:fs/promises';
import protobuf from 'protobufjs';
import { f32ArrayToF16Buffer } from './f16.mjs';

const FALLBACK_PROTO_URL = 'https://raw.githubusercontent.com/onnx/onnx/main/onnx/onnx.proto3';
const FALLBACK_LOCAL_PROTO = '/tmp/opencode/ablation-spike/onnx.proto3';

export async function loadOnnxTypes() {
  let protoText;
  try {
    protoText = await readFile(process.env.ONNX_PROTO_PATH || FALLBACK_LOCAL_PROTO, 'utf8');
  } catch {
    const response = await fetch(FALLBACK_PROTO_URL);
    if (!response.ok) throw new Error(`Unable to fetch ONNX proto: HTTP ${response.status}`);
    protoText = await response.text();
  }
  const root = protobuf.parse(protoText, { keepCase: true }).root;
  return {
    root,
    ModelProto: root.lookupType('onnx.ModelProto'),
    TensorProto: root.lookupType('onnx.TensorProto'),
    NodeProto: root.lookupType('onnx.NodeProto'),
    ValueInfoProto: root.lookupType('onnx.ValueInfoProto'),
  };
}

export function decodeModel(types, bytes) {
  return types.ModelProto.decode(bytes);
}

export function encodeModel(types, model) {
  return new Uint8Array(types.ModelProto.encode(model).finish());
}

export function cloneMessage(Type, msg) {
  return Type.create(Type.toObject(msg, { bytes: Buffer }));
}

export function addOutputs(types, graph, tensorNames) {
  const existing = new Set(graph.output.map((o) => o.name));
  const valueInfo = new Map(graph.value_info.map((vi) => [vi.name, vi]));
  let added = 0;
  for (const name of tensorNames) {
    if (existing.has(name)) continue;
    const vi = valueInfo.get(name);
    if (!vi) throw new Error(`No value_info for tensor output ${name}`);
    graph.output.push(cloneMessage(types.ValueInfoProto, vi));
    added++;
  }
  return added;
}

export function summarizeConsumers(graph, tensorName) {
  const consumers = [];
  graph.node.forEach((node, nodeIdx) => {
    node.input.forEach((input, inputIdx) => {
      if (input === tensorName) consumers.push({ nodeIdx, inputIdx, name: node.name, op: node.op_type });
    });
  });
  return consumers;
}

export function llamaCarryTensors(graph) {
  const tensors = [];
  for (const node of graph.node) {
    const m = node.name?.match(/\/model\/layers\.(\d+)\/(input_layernorm|post_attention_layernorm)\/SkipLayerNorm/);
    if (!m) continue;
    if (node.output.length >= 4 && node.output[3]) {
      tensors.push({ layer: Number(m[1]), kind: m[2], output: node.output[3], normOutput: node.output[0] });
    }
  }
  tensors.sort((a, b) => a.layer - b.layer || a.kind.localeCompare(b.kind));
  return tensors;
}

export function gemmaResidualTensors(graph) {
  const tensors = [];
  for (const node of graph.node) {
    const m = node.name?.match(/\/model\/layers\.(\d+)\/(input_layernorm|post_attention_layernorm|pre_feedforward_layernorm|post_feedforward_layernorm)\//);
    if (!m) continue;
    for (const [idx, output] of node.output.entries()) {
      if (output) tensors.push({ layer: Number(m[1]), kind: m[2], outputIndex: idx, output, op: node.op_type, name: node.name });
    }
  }
  tensors.sort((a, b) => a.layer - b.layer || a.kind.localeCompare(b.kind) || a.outputIndex - b.outputIndex);
  return tensors;
}

export function gemmaLayerScalarTensors(graph) {
  const tensors = [];
  for (const node of graph.node) {
    const m = node.name?.match(/\/model\/layers\.(\d+)\/layer_scalar\/Mul/);
    if (!m || !node.output?.[0]) continue;
    tensors.push({ layer: Number(m[1]), kind: 'layer_scalar', output: node.output[0], op: node.op_type, name: node.name });
  }
  tensors.sort((a, b) => a.layer - b.layer);
  return tensors;
}

export function insertActivationAblation(types, graph, { targetTensor, direction, alpha, tag }) {
  const hiddenDim = direction.length;
  const vColName = `ablation_${tag}_v_col`;
  const vRowName = `ablation_${tag}_v_row`;
  const alphaName = `ablation_${tag}_alpha`;
  const projName = `ablation_${tag}_proj`;
  const projVName = `ablation_${tag}_proj_v`;
  const scaledName = `ablation_${tag}_scaled`;
  const outName = `ablation_${tag}_out`;

  graph.initializer.push(types.TensorProto.create({
    name: vColName,
    data_type: 10,
    dims: [hiddenDim, 1],
    raw_data: f32ArrayToF16Buffer(direction),
    data_location: 0,
  }));
  graph.initializer.push(types.TensorProto.create({
    name: vRowName,
    data_type: 10,
    dims: [1, hiddenDim],
    raw_data: f32ArrayToF16Buffer(direction),
    data_location: 0,
  }));
  graph.initializer.push(types.TensorProto.create({
    name: alphaName,
    data_type: 10,
    dims: [],
    raw_data: f32ArrayToF16Buffer(Float32Array.from([alpha])),
    data_location: 0,
  }));

  const makeNode = (name, op_type, input, output) => types.NodeProto.create({ name, op_type, input, output, attribute: [] });
  const nodes = [
    makeNode(`/ablation/${tag}/matmul_h_v`, 'MatMul', [targetTensor, vColName], [projName]),
    makeNode(`/ablation/${tag}/mul_proj_v`, 'Mul', [projName, vRowName], [projVName]),
    makeNode(`/ablation/${tag}/scale`, 'Mul', [projVName, alphaName], [scaledName]),
    makeNode(`/ablation/${tag}/sub`, 'Sub', [targetTensor, scaledName], [outName]),
  ];

  const producerIdx = graph.node.findIndex((n) => n.output.includes(targetTensor));
  if (producerIdx < 0) throw new Error(`Producer not found for ${targetTensor}`);
  graph.node.splice(producerIdx + 1, 0, ...nodes);

  let rewired = 0;
  for (let i = producerIdx + 1 + nodes.length; i < graph.node.length; i++) {
    const node = graph.node[i];
    for (let j = 0; j < node.input.length; j++) {
      if (node.input[j] === targetTensor) {
        node.input[j] = outName;
        rewired++;
      }
    }
  }
  return { outName, producerIdx, rewired };
}

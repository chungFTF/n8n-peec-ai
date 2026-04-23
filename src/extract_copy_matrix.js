// 接在 copy instruction agent 後面
// 解析 output，把 copy_instruction_matrix 整理成單一 item 傳給文案生成 agent
const raw = $input.first().json;

let data;
if (typeof raw.output === 'string') {
  const cleaned = raw.output.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  data = JSON.parse(cleaned);
} else if (typeof raw.output === 'object' && raw.output !== null) {
  data = raw.output;
} else {
  data = raw;
}

const matrix = data.copy_instruction_matrix;
if (!Array.isArray(matrix) || matrix.length === 0) {
  throw new Error('extract_copy_matrix: copy_instruction_matrix 為空或格式錯誤');
}

return [{ json: { copy_instruction_matrix: matrix } }];

// Runs after the copy instruction agent.
// Parses the output and passes copy_instruction_matrix as a single item to the copy writer agent.
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
  throw new Error('extract_copy_matrix: copy_instruction_matrix is empty or malformed');
}

return [{ json: { copy_instruction_matrix: matrix } }];

const allItems = $input.all();

// Item with copy_instruction_matrix = strategy source
const matrixItem = allItems.find(i => i.json.copy_instruction_matrix);
const matrix = matrixItem?.json.copy_instruction_matrix || [];

// Remaining items = created Google Docs (have documentId + platform)
const docItems = allItems.filter(i => i.json.documentId && i.json.platform);

// Match by position (matrix and docs are in the same order)
return matrix.map((strategy, idx) => {
  const doc = docItems[idx];
  if (!doc) throw new Error(`No document found for matrix item ${idx} (${strategy.platform})`);

  return {
    json: {
      documentId:       doc.json.documentId,
      platform:         strategy.platform,
      platform_type:    strategy.platform_type,
      content_format:   strategy.content_format,
      audience:         strategy.audience,
      content_brief:    strategy.content_brief,
      copy_direction:   strategy.copy_direction,
      reference_insight: strategy.reference_insight,
      reason:           strategy.reason,
      priority:         strategy.priority,
      timeframe:        strategy.timeframe,
    },
  };
});

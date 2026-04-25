const allItems = $input.all();

// Separate items by type
const docItems    = allItems.filter(i => i.json.kind === 'drive#file' && i.json.id);
const copyItems   = allItems.filter(i => i.json.content !== undefined && i.json.title !== undefined);

// Pair by position: copy item N → doc item N
return copyItems.map((copyItem, idx) => {
  const doc = docItems[idx];
  if (!doc) throw new Error(`No Google Doc found for copy item ${idx} (${copyItem.json.platform})`);

  return {
    json: {
      documentId: doc.json.id,
      title:      copyItem.json.title,
      content:    copyItem.json.content,
      platform:   copyItem.json.platform,
      priority:   copyItem.json.priority,
      copy_direction: copyItem.json.copy_direction,
    },
  };
});

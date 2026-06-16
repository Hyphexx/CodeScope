function buildTreeFromFiles(files) {
  const root = { name: "root", children: {}, files: [] };

  files.forEach((file) => {
    root.files.push(file.name);
  });

  return root;
}

function TreeNode({ node, level = 0 }) {
  const folders = Object.values(node.children || {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const files = [...(node.files || [])].sort((a, b) => a.localeCompare(b));

  return (
    <div className="tree-node" style={{ "--level": level }}>
      {folders.map((folder) => (
        <div key={folder.name}>
          <div className="tree-row folder-row">▸ {folder.name}</div>
          <TreeNode node={folder} level={level + 1} />
        </div>
      ))}

      {files.map((file) => (
        <div className="tree-row file-row" key={file}>
          {file}
        </div>
      ))}
    </div>
  );
}

export default function FileTree({ files = [], tree }) {
  const treeData = tree || buildTreeFromFiles(files);
  const hasFiles =
    files.length > 0 ||
    (treeData.files || []).length > 0 ||
    Object.keys(treeData.children || {}).length > 0;

  if (!hasFiles) {
    return <p className="muted">No files selected yet.</p>;
  }

  return (
    <div className="file-tree">
      <TreeNode node={treeData} />
    </div>
  );
}

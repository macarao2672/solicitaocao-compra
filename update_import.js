const fs = require('fs');
let content = fs.readFileSync('src/components/requests/ImportImageModal.tsx', 'utf8');

content = content.replace(
  /<div className="p-3 text-center text-xs text-orange-400\/80 bg-orange-950\/20 border border-orange-900\/30 rounded-lg">[\s\S]*?<\/div>/,
  ""
);

content = content.replace(
  /<span>Preencher e Revisar<\/span>/g,
  ""
);

fs.writeFileSync('src/components/requests/ImportImageModal.tsx', content);

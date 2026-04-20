import * as fs from 'fs';
import * as path from 'path';

function processFile(filePath) {
  let initial = fs.readFileSync(filePath, 'utf8');
  let data = initial;

  // Find patterns like: const data = await res.json();
  // We want to replace it with:
  // let data;
  // const contentType = res.headers.get("content-type");
  // if (contentType && contentType.includes("application/json")) { data = await res.json(); }
  // else { const text = await res.text(); data = { error: text || 'Error' }; }
  
  // Or simply replace `await res.json()` with a safer helper if we don't know the exact assignment.
  // Actually, replacing `await res.json()` everywhere is tricky because of scope.
  
  // Instead of complex AST parsing, let's just create a global fetch wrapper or add a helper function.
  // We will replace `const [name] = await res.json()` pattern.
  
  const regex = /const ([a-zA-Z0-9_]+) = await res\.json\(\);/g;
  data = data.replace(regex, `
      let $1;
      try {
        const contentType = res.headers?.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          $1 = await res.json();
        } else {
          const text = await res.text();
          $1 = { error: text || 'Rate exceeded or server error' };
        }
      } catch (e) {
        $1 = { error: 'Invalid JSON response' };
      }
  `);

  const regex2 = /result = await res\.json\(\);/g;
  data = data.replace(regex2, `
        const contentType = res.headers?.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          result = await res.json();
        } else {
          const text = await res.text();
          result = { error: text || 'Rate exceeded or server error' };
        }
  `);

  if (initial !== data) {
    fs.writeFileSync(filePath, data);
    console.log('Modified', filePath);
  }
}

// Just modify App.tsx for now
processFile('src/App.tsx');
console.log('Done');

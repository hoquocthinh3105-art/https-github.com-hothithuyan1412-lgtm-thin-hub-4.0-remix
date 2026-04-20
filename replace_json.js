import * as fs from 'fs';

const path = 'src/App.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace(/\.then\(res => res\.json\(\)\)/g, '.then(async res => { const t = await res.text(); try { return JSON.parse(t); } catch { return []; } })');

fs.writeFileSync(path, data);
console.log('Done replacement');

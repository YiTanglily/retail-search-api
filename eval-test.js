import fs from "fs";

const readFiles = JSON.parse(fs.readFileSync("eval-tester.json", "utf-8"));
//  used the "fs" tool to read async files
let correct = 0;

async function evaluation() {
  for (const t of readFiles) {
    const tests = await fetch(`http://localhost:3000/search?q=${t.query}`);
    const result = await tests.json();
    const titles = result.map((r) => r.title);

    if (titles.includes(t.expected_answer)) {
      correct = correct + 1;
    }
  }

  console.log((correct / readFiles.length) * 100 + "%");
}
evaluation();

const fs = require("fs");
const csv = require("fast-csv");

function getCSVData(fp, filename) {
  const d = [];
  let index = 1;

  fs.createReadStream(`${fp}/${filename}.csv`)
    .pipe(csv.parse({ headers: true }))
    .on("error", (error) => console.error(error))
    .on("data", (row) => {
      // console.log(row);
      row["index"] = index;
      d.push(row);
      index += 1;
    })
    .on("end", (rowCount) => {
      console.log(`Parsed ${rowCount} rows`);
      let data = JSON.stringify(d, null, 2);
      fs.writeFileSync(`${fp}/${filename}.json`, data);
    });
}

getCSVData("./data", "filename");

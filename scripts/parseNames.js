const fs = require('fs');
const mkdirp = require('mkdirp');
const cheerio = require('cheerio');
const d3 = require('d3');

// const START = { month: 6, year: 2015 };
// const MONTHS = [
//   'January',
//   'February',
//   'March',
//   'April',
//   'May',
//   'June',
//   'July',
//   'August',
//   'September',
//   'October',
//   'November',
//   'December'
// ];
const outputDir = './output';
const inputDir = './output/year-pages';

// function checkForDate(str) {
//   const split = str.split(' ');
//   const isMonth = MONTHS.includes(split[0]);
//   const isDate = !isNaN(split[1]);
//   return isMonth && isDate;
// }

function parseLi({ sel, year, monthIndex }) {
  if (sel.text().startsWith('Date unknown')) return null;

  const isPerson = !sel.find('ul').length;

  if (isPerson) {
    const a = sel.find('a');

    const firstA = a.first();
    const firstTitle = firstA.attr('title');
    const isDate = checkForDate(firstTitle);
    const name = isDate ? a.eq(1).attr('title') : firstTitle;
    const link = isDate ? a.eq(1).attr('href') : firstA.attr('href');

    // birth year
    const birthSel = a.eq(-1);
    const year_of_birth = birthSel.attr('title');

    // date of death
    let date_of_death = null;
    if (isDate) {
      date_of_death = a.eq(0).attr('title');
    } else {
      const parentLi = sel.parent().parent();
      date_of_death = parentLi
        .find('a')
        .first()
        .attr('title');
    }

    const year_of_death = year;
    const monthPad = d3.format('02')(monthIndex + 1);
    const datePad = d3.format('02')(date_of_death.split(' ')[1]);
    const timestamp_of_death = `${year}${monthPad}${datePad}`;
    return {
      link,
      name,
      year_of_birth,
      year_of_death,
      date_of_death,
      timestamp_of_death
    };
  }

  return null;
}

function checkValidStart(year, monthIndex) {
  if (+year === START.year && monthIndex < START.month) return false;
  return true;
}

function extractPeople(file) {
  const html = fs.readFileSync(`${inputDir}/${file}`, 'utf-8');
  const $ = cheerio.load(html);

  const peopleByMonth = MONTHS.map((month, monthIndex) => {
    const parent = $(`#${month}_2`).parent();
    const ul = parent.nextAll('ul').eq(0);
    const year = file.replace('.html', '');

    const output = [];
    ul.find('li').each((i, el) => {
      const person = parseLi({ sel: $(el), year, monthIndex });
      if (person && checkValidStart(year, monthIndex)) output.push(person);
    });
    return output;
  });

  return [].concat(...peopleByMonth);
}

function init() {
  const files = fs.readdirSync(inputDir).filter(d => d.includes('.html'));

  const peopleByYear = files.map(extractPeople);
  const flatPeople = [].concat(...peopleByYear);

  const output = d3.csvFormat(flatPeople);

  mkdirp(outputDir);
  fs.writeFileSync('./output/atpPlayer.csv', output);
}

init();
const puppeteer = require('puppeteer')
const validUrl = require('valid-url');
const fs = require('fs');

const {
  VARIABLE = '',
} = process.env

exports.handler = function (event, context, callback) {
  const url = event.queryStringParameters.url || "";

  if (!validUrl.isUri(url)) {
    console.error('Not a valid URL')
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: `Not a valid URL ${url}` }),
    }
  }

  (async () => {
  const browser = await puppeteer.launch({ headless: true })

  const page = await browser.newPage()

  page.on('console', async msg => {
    const args = msg.args();
    const vals = [];
    for (let i = 0; i < args.length; i++) {
      vals.push(await args[i].jsonValue());
    }
    console.log(vals.join('\t'));
  });
  page.setDefaultNavigationTimeout(0);

  await page.goto(url, { waitUntil: 'load', timeout: 0 })
  console.log("Loading results until end of page...")
  await page.waitForSelector('table#resultats')

  // SCROLL hasta el final
  await page.evaluate(() => {
    const wait = (duration) => {
      //console.log('waiting', duration);
      return new Promise(resolve => setTimeout(resolve, duration));
    };

    (async () => {
      window.atBottom = false;
      const scroller = document.documentElement;  // usually what you want to scroll, but not always
      let lastPosition = -1;
      while (!window.atBottom) {
        scroller.scrollTop += scroller.scrollHeight;
        // scrolling down all at once has pitfalls on some sites: scroller.scrollTop = scroller.scrollHeight;
        await wait(900);
        const currentPosition = scroller.scrollTop;
        if (currentPosition > lastPosition) {
          //console.log('currentPosition', currentPosition);
          lastPosition = currentPosition;
        }
        else {
          window.atBottom = true;
        }
      }
      console.log('Done!');
    })();
  });

  await page.waitForFunction('window.atBottom == true', {
    timeout: 900000,
    polling: 1000 // poll for finish every second
  });

  // Wait para prevenir
  await page.waitForTimeout(500)
  console.log('Scrapping...');
  const resultats = {}

  resultats.cursa =  await page.$eval('.header-image > h1:nth-child(3) > a:nth-child(1)', el => el.innerText)
  resultats.tipus =  await page.$eval('.reset-link', el => el.innerText)
  resultats.data = await page.$eval('.header-image > flexbox:nth-child(5)', el => el.innerText)
  resultats.classificacio = []

  const corredores = await page.$$('.resultats tr[class^=\'resultrow\'], .resultats tr[class^=\'bottom-border\']')

  for (r = 0; r < corredores.length; r += 2) {
      const corredor = {}
      const data = [
        {
          row: r,
          field: 'nom',
          selector: 'td.row4',
          property: 'text',
          clean: ''
        },
        {
          row: r,
          field: 'posicio',
          selector: 'td.row1.position',
          property: 'text',
          clean: ''
        },
        {
          row: r,
          field: 'posicio_sexe',
          selector: 'td.position-sex',
          property: 'text',
          clean: ''
        },
        {
          row: r,
          field: 'dorsal',
          selector: 'td.row3',
          property: 'text',
          clean: ''
        },
/*        {
          row: r,
          field: 'url',
          selector: 'td.row3-bis a',
          property: 'href',
          clean: ''
        },

        {
          row: r,
          field: 'imatge',
          selector: 'td.row3-bis img',
          property: 'src',
          clean: ''
        },
*/
        {
          row: r + 1,
          field: 'temps_real',
          selector: 'p[id$=temps_real]',
          property: 'text',
          clean: 'T. real:'
        },
        {
          row: r + 1,
          field: 'ritme',
          selector: 'p[id$=ritme]',
          property: 'text',
          clean: 'Ritme:'
        },
        {
          row: r + 1,
          field: 'ritme',
          selector: '.collapse > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > p:nth-child(1)',
          property: 'text',
          clean: 'Inici real:'
        },
        {
          row: r + 1,
          field: 'hora_meta',
          selector: 'p[id$=hora_meta]',
          property: 'text',
          clean: 'Hora meta:'
        },
        {
          row: r + 1,
          field: 'categoria',
          selector: 'span.category-name',
          property: 'text',
          clean: ''
        },
        {
          row: r + 1,
          field: 'posiscio_categoria',
          selector: 'p[id$=pos_categoria]',
          property: 'text',
          clean: 'Pos. categoria:'
        },
        {
          row: r + 1,
          field: 'club',
          selector: '.collapse > div:nth-child(1) > div:nth-child(5) > div:nth-child(2) > p:nth-child(1)',
          property: 'text',
          clean: 'Club:'
        },
        {
          row: r + 1,
          field: 'inici_cursa',
          selector: '.collapse > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > p:nth-child(1)',
          property: 'text',
          clean: 'Inici cursa:'
        },
        {
          row: r + 1,
          field: 'sexe',
          selector: '.collapse > div:nth-child(1) > div:nth-child(4) > div:nth-child(2) > p:nth-child(1)',
          property: 'text',
          clean: 'Sexe:'
        },
      ]

      for (let index = 0; index < data.length; index++) {
        const d = data[index];
        let element = ''
        switch (d.property) {
          case 'href':
            element = await corredores[d.row].$eval(d.selector, el => el.href)
            break;
          case 'src':
            element = await corredores[d.row].$eval(d.selector, el => el.src)
            break;

          default:
            element = await corredores[d.row].$eval(d.selector, el => el.innerText.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim())
            element = element.replace(d.clean, '').trim()
            break;
        }
        corredor[d.field] = element
      }

   resultats.classificacio.push(corredor)

  }
  browser.close()

    try {
    return {
      statusCode: 200,
      body: JSON.stringify(resultats),
    }
  } catch (err) {
    return {
      statusCode: err.code,
      body: JSON.stringify({ msg: err.message }),
    }
  }
})()

}

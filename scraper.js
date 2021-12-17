const puppeteer = require('puppeteer')
require('dotenv').config();
const fs = require('fs');
const { emitKeypressEvents } = require('readline');

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
  await page.setDefaultNavigationTimeout(0);

  await page.goto('https://xipgroc.cat/ca/chip_user/sign_in')
  await page.type('#chip_user_email', process.env.USERNAME)
  await page.type('#chip_user_password', process.env.PASSWORD)
  await page.click('.grey-zone > input')
  await page.waitForNavigation()
  console.log("Login")
  await page.screenshot({ path: 'login.png' })
  await page.goto("https://xipgroc.cat/social/clubs/514/curses", { waitUntil: 'load', timeout: 0 })
  console.log("Entramos con las curses")
  await page.click('li#curses-link a')
  await page.waitForNavigation()
  await page.type('#date-from','2021-01-01')
  await page.type('#date-to','2021-12-25')
  console.log("Vamos con las curses")
  await page.screenshot({ path: 'curses.png' })

  // SCROLL hasta el final
  await page.evaluate(() => {

    const wait = (duration) => {
      console.log('waiting', duration);
      return new Promise(resolve => setTimeout(resolve, duration));
    };

    (async () => {

      window.atBottom = false;
      const scroller = document.documentElement;  // usually what you want to scroll, but not always
      let lastPosition = -1;
      while(!window.atBottom) {
        scroller.scrollTop += 1000;
        // scrolling down all at once has pitfalls on some sites: scroller.scrollTop = scroller.scrollHeight;
        await wait(900);
        const currentPosition = scroller.scrollTop;
        if (currentPosition > lastPosition) {
          console.log('currentPosition', currentPosition);
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


 const mostrarResultats = await page.$$('.res-subcursa')

  for (const el of mostrarResultats) {
    await el.evaluate(e => e.click());
  }
  await page.waitForTimeout(4000)

  const cursas = await page.$$('.curses-clubs-tbody')
  const cursaList = []
  for(const el of cursas) {
    const cursa = {}
    cursa.nombre =  await el.$eval('td:nth-child(2)>p', el => el.innerText)
    cursa.tipus = await el.$eval('.run-type', el => el.innerText)
    cursa.distancia = await el.$eval('.curses-club-row-2 td div.title', el => el.innerText)
    cursa.fecha = await el.$eval('.curses-club-row-2>.date', el => el.innerText)
    cursa.fecha = await el.$eval('.curses-club-row-2>.date', el => el.innerText)
    cursa.corredores = []

    const corredores = await el.$$('table.resultats-club tr')

    for (r = 0; r < corredores.length; r += 2) {
      const corredor = {}
      const data = [
        {
          row : r,
          field : 'nom',
          selector : 'td.row4',
          property  : 'text',
          clean : ''
        },
        {
          row : r,
          field : 'posicio',
          selector : 'td.position',
          property  : 'text',
          clean : ''
        },
        {
          row : r,
          field : 'posicio_sexe',
          selector : 'td.position-sex',
          property  : 'text',
          clean : ''
        },
        {
          row : r,
          field : 'dorsal',
          selector : 'td.row3',
          property  : 'text',
          clean : ''
        },
        {
          row : r,
          field : 'url',
          selector : 'td.row3-bis a',
          property  : 'href',
          clean : ''
        },
        {
          row : r,
          field : 'imatge',
          selector : 'td.row3-bis img',
          property  : 'src',
          clean : ''
        },
        {
          row : r+1,
          field : 'temps_real',
          selector : 'p[id$=temps_real]',
          property  : 'text',
          clean : 'T. real:'
        },

        {
          row : r+1,
          field : 'ritme',
          selector : 'p[id$=ritme]',
          property  : 'text',
          clean : 'Ritme:'
        },
        {
          row : r+1,
          field : 'hora_meta',
          selector : 'p[id$=hora_meta]',
          property  : 'text',
          clean : 'Hora meta:'
        },
        {
          row : r+1,
          field : 'categoria',
          selector : 'span.category-name',
          property  : 'text',
          clean : ''
        },
        {
          row : r+1,
          field : 'posiscio_categoria',
          selector : 'p[id$=pos_categoria]',
          property  : 'text',
          clean : 'Pos. categoria:'
        },
        {
          row : r+1,
          field : 'club',
          selector : '.collapse > div:nth-child(1) > div:nth-child(5) > div:nth-child(2) > p:nth-child(1)',
          property  : 'text',
          clean : 'Club:'
        },
        {
          row : r+1,
          field : 'inici_cursa',
          selector : '.collapse > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > p:nth-child(1)',
          property  : 'text',
          clean : 'Inici cursa:'
        },
        {
          row : r+1,
          field : 'sexe',
          selector : '.collapse > div:nth-child(1) > div:nth-child(4) > div:nth-child(2) > p:nth-child(1)',
          property  : 'text',
          clean : 'Sexe:'
        },
        {
          row : r+1,
          field : 'clasificacio',
          selector : '.collapse > div:nth-child(1) > div:nth-child(6) > div:nth-child(1) > p:nth-child(1) > strong:nth-child(1) > a:nth-child(1)',
          property  : 'href',
          clean : 'Sexe:'
        },
      ]

      data.forEach(async data => {
        let element = ''
        switch (data.property) {
          case 'href':
            element = await corredores[data.row].$eval(data.selector, el => el.href)
            break;
          case 'src':
            element = await corredores[data.row].$eval(data.selector, el => el.src)
            break;

          default:
            element = await corredores[data.row].$eval(data.selector, el => el.innerText.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim())
            element = element.replace(data.clean, '').trim()
            break;
        }
        corredor[data.field] = element
      });

      corredor.id = corredor.url != null ? corredor.url.split("/")[5] : ''
      await corredores[r+1].$eval('.collapse', el => el.innerText) //TODO: NO HACE NADA PERO SINO HACEMOS UN WAIT PETA LA SALIDA, PORQUE SALE ANTES

      cursa.corredores.push(corredor)
    }

    cursaList.push(cursa)
  }
  console.log(JSON.stringify(cursaList))

  fs.writeFileSync('curses.json', JSON.stringify(cursaList));

  browser.close()

})()

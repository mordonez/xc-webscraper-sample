const puppeteer = require('puppeteer')
require('dotenv').config();
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false })
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
  //await page.type('#date-from','2021-01-01')
  //await page.type('#date-to','2021-12-25')
  console.log("Vamos con las curses")
  await page.screenshot({ path: 'curses.png' })

  // Click all veure resultats
  //document.querySelectorAll('.curses-clubs-tbody tr:nth-child(3) > td:nth-child(1) > a:nth-child(1)').forEach(element => {element.click()});

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

  function cleanLabel(text, label) {
    var ret = text.replace(label,'').trim();
    return ret
  }
  
  async function findBySelector(element, selector) {
    try {
      return result = element.$eval(selector, el => el.innerText.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim())
      
    } catch (error) {
      return ''
    }
  }
  
  const cursas = await page.$$('.curses-clubs-tbody')
  var cursaList = []
  for(const el of cursas) {
    const name = await el.$eval('td:nth-child(2)>p', el => el.innerText)
    cursa = {}
    cursa.nombre =  await el.$eval('td:nth-child(2)>p', el => el.innerText)
    cursa.distancia = await el.$eval('.curses-club-row-2 td div.title', el => el.innerText)
    cursa.fecha = await el.$eval('.curses-club-row-2>.date', el => el.innerText)
    cursa.corredores = []
    
    const corredores = await el.$$('table.resultats-club tr')

    
    for (r = 0; r < corredores.length; r += 2) {
      basic = corredores[r]
      detail = corredores[r + 1]
      corredor = {}
      data = [
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

      
      //corredor.id = corredor.url != null ? corredor.url.split("/")[5] : ''      
      corredor.club = await detail.$eval('.collapse > div:nth-child(1) > div:nth-child(5) > div:nth-child(2) > p:nth-child(1)', el => el.innerText.replace(/[\n\r]+|[\s]{2,}/g, ' ').replace('Club:','').trim())
      cursa.corredores.push(corredor)
    }

    cursaList.push(cursa)
  }

  console.log(JSON.stringify(cursaList))

  fs.writeFileSync('curses.json', JSON.stringify(cursaList));
/*
  await page.waitForSelector('.curses-clubs-tbody')

  let curses = await page.evaluate(() => {
    let curses = Array.from(document.querySelectorAll('.curses-clubs-tbody'));
    var cursaList = []
    console.log("Curses " + curses.length)
    for (i = 0; i < curses.length; i++) {

      x = curses[i]
      cursa = {}

      cursa.name = x.querySelector("td:nth-child(2)>p").textContent
      field = x.querySelector(".curses-club-row-2 td div.title")
      cursa.distance = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
      cursa.date = x.querySelector(".curses-club-row-2>.date").textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim()


    let rows = Array.from(x.querySelectorAll('td.render-resultats table.resultats-club tr'));
    console.log()
    // First div is hidden
    cursa.runners = []
    for (r = 0; r < rows.length; r += 2) {
      basic = rows[r]
      detail = rows[r + 1]
      runner = {}

      field = basic.querySelector("td.position")// Position
      runner.position = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
      field = basic.querySelector("td.position-sex") // Position by SEX
      runner.positionsex = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
      field = basic.querySelector("td.row3-bis img") // Image profile
      runner.image = field != null ? field.src : ''
      field = basic.querySelector("td.row3-bis a") // link profile
      runner.profile = field != null ? field.href : ''
      runner.id = runner.profile != '' ? runner.profile.split("/")[5] : ''
      field = basic.querySelector("td.row4") // Name surname
      runner.name = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
      field = basic.querySelector("td.row5") //Meta time
      runner.time = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
      // TODO: FIX Selector
      field = detail.querySelector("p[id$=temps_real]") //
      runner.time_real = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
      runner.time_real = ''
      runner.time_oficial = ''
      runner.time_real =  ''
      runner.pace = ''

        cursa.runners.push(runner)

    }


      cursaList.push(cursa)
    }

  /**
    await page.goto("https://xipgroc.cat/ca/social/clubs/514/members", { waitUntil: 'load', timeout: 0 })
    console.log("Entramos con las curses")
    await page.waitForSelector('.curses-clubs-tbody')
    // Click all veure resultats
    //document.querySelectorAll('a.res-member').forEach(element => {element.click()});
    let links = await page.$$('.curses-clubs-tbody tr:nth-child(3) > td:nth-child(1) ');
    for (let i = 0; i < links.length; i++) {
      let button = await links[i].$('a:nth-child(1)');
      await button.click();
    }

    await page.waitForSelector('.club-history')


    let rows = Array.from(document.querySelectorAll('.club-history > .col-md-8 > div'));
    // First div is hidden
    miembros = []
    for (i = 1; i < rows.length - 1; i += 2) {
      m = rows[i]
      r = rows[i + 1]
      miembro = {}
      field = m.querySelector(".im-wrapper img")// Image
      miembro.image = field != null ? field.src : ''
      field = m.querySelector("h3")// Image
      miembro.name = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
      miembro.races = []
      races = Array.from(r.querySelectorAll("#table-club-member tr[href*=res-div]"));
      races.forEach(item => {
        race = {}
        field = item.querySelector("td.col1")// Position
        race.position = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
        field = item.querySelector("td.col2")// Position sex
        race.position_sex = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
        field = item.querySelector("td.col3")// Title
        race.title = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
        field = item.querySelector("td.col4")// Title
        race.date = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
        field = item.querySelector("td.col5")// Title
        race.time = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
        miembro.races.push(race)
      });
      next = r.querySelector("ul.pagination a[rel=next]");
      if (next) {
        console.log("Tiene siguiente")
      }


      miembros.push(miembro)
      console.log(miembro)
    }
  */


//    return cursaList

  //});

// console.log(JSON.stringify(curses))


  browser.close()

})()

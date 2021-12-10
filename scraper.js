const puppeteer = require('puppeteer')
const C = require('./.env');
(async () => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setDefaultNavigationTimeout(0);

  await page.goto('https://xipgroc.cat/ca/chip_user/sign_in')
  await page.type('#chip_user_email', C.username)
  await page.type('#chip_user_password', C.password)
  await page.click('.grey-zone > input')
  await page.waitForNavigation()
  console.log("Login")
  await page.screenshot({ path: 'login.png' })
  await page.goto("https://xipgroc.cat/social/clubs/514/curses?Slider1=;100&date-from=20/11/2000&date-to=25/12/2021", { waitUntil: 'load', timeout: 0 })
  console.log("Entramos con las curses")
  await page.waitForSelector('.curses-clubs-tbody')
  console.log("Vamos con las curses")
  await page.screenshot({ path: 'curses.png' })

  // Click all veure resultats
  //document.querySelectorAll('.curses-clubs-tbody tr:nth-child(3) > td:nth-child(1) > a:nth-child(1)').forEach(element => {element.click()});
  let links = await page.$$('.curses-clubs-tbody tr:nth-child(3) > td:nth-child(1) ');

  for (let i = 0; i < links.length; i++) {
    let button = await links[i].$('a:nth-child(1)');
    await button.click();
  }

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
      runners = Array.from(x.querySelectorAll("td.render-resultats table.resultats-club tr.resultrow"));
      cursa.runners = []
      for (r = 0; r < runners.length; r++) {
        y = runners[r]
        runner = {}
        field = y.querySelector("td.position")// Position
        runner.position = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
        field = y.querySelector("td.position-sex") // Position by SEX
        runner.positionsex = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
        field = y.querySelector("td.row3-bis img") // Image profile
        runner.image = field != null ? field.src : ''
        field = y.querySelector("td.row4") // Name surname
        runner.name = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''
        field = y.querySelector("td.row5") //Meta time
        runner.time = field != null ? field.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim() : ''

        cursa.runners.push(runner)

      }

      cursaList.push(cursa)
    }


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

    return cursaList

  });

  console.log(JSON.stringify(curses))


  browser.close()

})()

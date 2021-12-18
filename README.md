# Webscrapper Sample using puppeter

Disclaimer: Only for educational purposes!

## How to download a race

_node xipgroc-scraper-cursa.js RACE-URL_

```
npm install
node xipgroc-scraper-cursa.js https://xipgroc.cat/ca/curses/Sitges2020/mitja/resultats
```
## How to download all races and teams 

```
npm install
echo USERNAME=YOUR-USERNAME >> .env
echo PASSWORD=YOUR-PASSWORD >> .env
echo CLUBID=YOUR-CLUBID >> .env
node xipgroc-scraper-club.js
```

TODO:

- [ ] Improve performance
- [ ] Serverless function
- [ ] ...

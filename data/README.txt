Place your real spreadsheet here, named exactly:

    BloxFruit_Business_Analytics.xlsx

The Business page (html/business.html) will automatically load it and
display it as an interactive, scrollable table with sheet tabs.

Notes:
- Works when the site is served over HTTP (GitHub Pages, or a local
  server like "python -m http.server"). Opening the HTML file directly
  from disk (file://) blocks the fetch, so the screenshot fallback
  will show instead.
- If the file is missing or fails to load, the screenshot is shown.
- .xlsx, .xls and .csv all work (update the data-src attribute in
  business.html if you change the filename).

const domQueries = [
  {
    Method: "querySelector",
    Input: selector,
    Result: document.querySelector(selector)?.tagName || "(none)",
  },
  {
    Method: "querySelectorAll",
    Input: selector,
    Result: document.querySelectorAll(selector).length + " element(s)",
  },
  {
    Method: "getElementById",
    Input: id,
    Result: document.getElementById(id)?.tagName || "(none)",
  },
  {
    Method: "getElementsByClassName",
    Input: className,
    Result: document.getElementsByClassName(className).length + " element(s)",
  },
  {
    Method: "getElementsByTagName",
    Input: tagName,
    Result: document.getElementsByTagName(tagName).length + " element(s)",
  },
];

console.table(domQueries);

var isBrowser = typeof window !== 'undefined';

// Returns a new function that throws an error if the given function is attempted called in a non-browser env.
function browserOnly(fn) {
  return function() {
    if (!isBrowser) {
      var fnName = fn.name || '<anonymous>';
      throw new Error("Attempted to call function '"+fnName+"', in a non-browser environment. " +
      "You probably want to wrap this call in a if (typeof window !== 'undefined') {...} statement.")
    }
    return fn.apply(this, arguments);
  }
}


function addListener(evnt, elem, func) {
  if (elem.addEventListener) elem.addEventListener(evnt,func,false);
  else if (elem.attachEvent) {
    return elem.attachEvent("on"+evnt, func);
  }
}

module.exports = {
  browserOnly: browserOnly,
  addListener: addListener
};
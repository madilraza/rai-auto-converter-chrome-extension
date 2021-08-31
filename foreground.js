let RAI = ' RAI';
let storedData;


/**
 * Gets stored data
 */
 chrome.storage.sync.get('data', (res) => {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }

  storedData = res.data;
  
  if (storedData.enabled) {
    searchCurrency(document.body);
    startObserver();
  }
});


/**
 * Listens to preferences and conversion updates sent from the background
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (storedData.enabled && !message.enabled) {
    disconnectObserver();
  } else if (!storedData.enabled && message.enabled) {
    searchCurrency(document.body);
    startObserver();
  }

  storedData = message;
});


/**
 * Observer to check for changes in the DOM
 */
const observer = new MutationObserver(mutations => {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'characterData') {
      searchCurrency(mutation.target.parentNode);
    } else if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        searchCurrency(node.parentNode);
      });
    }
  });
});


/**
 * Starts observer
 */
function startObserver() {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}


/**
 * Disconnects observer
 */
function disconnectObserver() {
  observer.disconnect()
}


const avoidedTags = ['html', 'head', 'script', 'noscript', 'style', 'img', 'textarea', 'input','audio', 'video'];
const regExpAmount = '-?\\d+(?:\\.\\d+)?(?:,\\d+(?:\\.\\d+)?)*';

/**
 * Searches nodes for currency symbols
 */
function searchCurrency(rootNode) {
  const baseRegExpShortDollar = '(USD|U.S.D.|US\\s?\\$|U.S.\\s?\\$|\\$)';
  const avoidedChars = '[a-zA-Z0-9\$]';
  const regExpPriceJoined =  '(?<!' + avoidedChars + ')(' + regExpAmount + '(' + baseRegExpShortDollar + '(?!' + avoidedChars + ')))|(((?<!' + avoidedChars + ')' + baseRegExpShortDollar + ')' + regExpAmount + ')(?!' + avoidedChars + ')'; // Amount and currency without space
  const regExpDollarShort = '(?<!' + avoidedChars + ')' + baseRegExpShortDollar + '(?!' + avoidedChars + ')'; // Currency (amount can be at left or right)
  const regExpDollarLong = '((^|(?<=\\s))((U\\.?S\\.?\\s*)?Dollar[s]?)\\b)'; // Currency (amount can be at left)

  const treeWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);

  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode;
    if (!avoidedTags.includes(node.parentNode.tagName.toLowerCase())) {
      if (new RegExp(regExpPriceJoined, 'gi').test(node.nodeValue)) { 
        // Amount and currency without space found (e.g. 11.1USD - $22)
        convertPrice(node, new RegExp(regExpPriceJoined, 'gi'), regExpAmount);
      } else if (new RegExp(regExpDollarShort, 'gi').test(node.nodeValue)) {
        // Currency found --> search amount left and right
        const regExpPriceLeft = new RegExp(regExpAmount + '\\s*' + regExpDollarShort, 'gi');
        const regExpPriceRight = new RegExp(regExpDollarShort + '\\s*' + regExpAmount, 'gi');
        if (regExpPriceLeft.test(node.nodeValue)) {
          // Amount found at left (e.g. 5.55 $)
          convertPrice(node, regExpPriceLeft, regExpAmount);
        } else if (regExpPriceRight.test(node.nodeValue)) {
          // Amount found at right (e.g. USD 66)
          convertPrice(node, regExpPriceRight, regExpAmount);
        } else if (new RegExp('^(' + regExpDollarShort + '|' + regExpDollarShort + ')$', 'gi').test(node.nodeValue.trim())) {
          // Currency symbol isolated in node --> search amount in other nodes (e.g. <span>$</span><span>6.66</span>)
          searchAmount(node, regExpDollarShort, true);
        }
      } else if (new RegExp(regExpDollarLong, 'gi').test(node.nodeValue)) {
        // Currency found --> search amount left
        const regExpPriceLeft = new RegExp(regExpAmount + '\\s*' + regExpDollarLong, 'gi');
        if (regExpPriceLeft.test(node.nodeValue)) {
          // Amount found at left (e.g. 7.77 Dollars)
          convertPrice(node, regExpPriceLeft, regExpAmount);
        } else if (new RegExp('^(' + regExpDollarLong + '|' + regExpDollarShort + ')$', 'gi').test(node.nodeValue.trim())) {
          // Currency symbol isolated in node --> search amount in other nodes (e.g. <span>8</span><span>US Dollar</span>)
          searchAmount(node, regExpDollarLong, false);
        }
      }
    }
  }
}


/**
 * Searches amounts near to a currency symbol
 */
function searchAmount(currencyNode, regExpDollar, searchBothSides) {  
  
  //////////////////// Search in right nodes //////////////////

  if (searchBothSides) {
    // Search in 'uncle' right nodes
    const firstRightUncle = getNextSibling(currencyNode.parentNode);
    if (firstRightUncle && firstRightUncle.nodeType === currencyNode.TEXT_NODE && isAmount(firstRightUncle.nodeValue)) {
      const raiAmount = fiatToRai(firstRightUncle.nodeValue.match(regExpAmount)[0]);
      firstRightUncle.nodeValue = raiAmount + RAI;
      currencyNode.nodeValue = '';
      return;
    } 


    // Search in 'cousin' right nodes
    if (firstRightUncle && firstRightUncle.firstChild && firstRightUncle.firstChild.nodeType === currencyNode.TEXT_NODE && isAmount(firstRightUncle.firstChild.nodeValue)) {
      const firstRightCousin = firstRightUncle.firstChild;
      currencyNode.nodeValue = '';
      
      if (containsDecimals(firstRightCousin.nodeValue)) {
        const raiAmount = fiatToRai(firstRightCousin.nodeValue.match(regExpAmount)[0]);
        firstRightCousin.nodeValue = raiAmount + RAI;
        return;
      }

      const secondRightUncle = getNextSibling(firstRightUncle);
      if (secondRightUncle && secondRightUncle.firstChild && secondRightUncle.firstChild.nodeType === currencyNode.TEXT_NODE && isNumber(secondRightUncle.firstChild.nodeValue, false)) {
        const secondRightCousin = secondRightUncle.firstChild;
        const raiAmount = fiatToRai(firstRightCousin.nodeValue.trim() + '.' + secondRightCousin.nodeValue.trim());
        firstRightCousin.nodeValue = raiAmount + RAI;
        secondRightCousin.nodeValue = '';
      } else {
        const raiAmount = fiatToRai(firstRightCousin.nodeValue);
        firstRightCousin.nodeValue = raiAmount + RAI;
      }

      return
    } 


    // Search in 'nephew' right nodes
    const firstRightBrother = getNextSibling(currencyNode);
    if (firstRightBrother && firstRightBrother.firstChild && firstRightBrother.firstChild.nodeType === currencyNode.TEXT_NODE && isAmount(firstRightBrother.firstChild.nodeValue)) {
      const firstRightNephew = firstRightBrother.firstChild;
      currencyNode.nodeValue = '';
      
      if (containsDecimals(firstRightNephew.nodeValue)) {
        const raiAmount = fiatToRai(firstRightNephew.nodeValue.match(regExpAmount)[0]);
        firstRightNephew.nodeValue = raiAmount + RAI;
        return;
      }

      const secondRightBrother = getNextSibling(firstRightBrother);
      if (secondRightBrother && secondRightBrother.firstChild && secondRightBrother.firstChild.nodeType === currencyNode.TEXT_NODE && isNumber(secondRightBrother.firstChild.nodeValue, false)) {
        const secondRightNephew = secondRightBrother.firstChild;
        const raiAmount = fiatToRai(firstRightNephew.nodeValue.trim() + '.' + secondRightNephew.nodeValue.trim());
        firstRightNephew.nodeValue = raiAmount + RAI;
        secondRightNephew.nodeValue = '';
      } else {
        const raiAmount = fiatToRai(firstRightNephew.nodeValue);
        firstRightNephew.nodeValue = raiAmount;
      }

      return
    } 
  }
  

  //////////////////// Search in left nodes //////////////////

  // Search in 'uncle' left nodes
  const firstLeftUncle = getPrevSibling(currencyNode.parentNode);

  if (firstLeftUncle && firstLeftUncle.nodeType === currencyNode.TEXT_NODE && isAmount(firstLeftUncle.nodeValue)) {
    const raiAmount = fiatToRai(firstLeftUncle.nodeValue.match(regExpAmount)[0]);
    firstLeftUncle.nodeValue = raiAmount;
    currencyNode.nodeValue = currencyNode.nodeValue.replace(new RegExp(regExpDollar, 'gi'), RAI);
    return;
  }


  // Search in 'cousin' left nodes
  if (firstLeftUncle && firstLeftUncle.firstChild && firstLeftUncle.firstChild.nodeType === currencyNode.TEXT_NODE && isAmount(firstLeftUncle.firstChild.nodeValue)) {
    const firstLeftCousin = firstLeftUncle.firstChild;
    currencyNode.nodeValue = currencyNode.nodeValue.replace(new RegExp(regExpDollar, 'gi'), RAI);

    if (containsDecimals(firstLeftCousin.nodeValue)) {
      const raiAmount = fiatToRai(firstLeftCousin.nodeValue.match(regExpAmount)[0]);
      firstLeftCousin.nodeValue = raiAmount;
      return;
    }

    const secondLeftUncle = getPrevSibling(firstLeftUncle);
    if (secondLeftUncle && secondLeftUncle.firstChild && secondLeftUncle.firstChild.nodeType === currencyNode.TEXT_NODE && isNumber(secondLeftUncle.firstChild.nodeValue, true)) {
      const secondLeftCousin = secondLeftUncle.firstChild;
      const raiAmount = fiatToRai(secondLeftCousin.nodeValue.trim() + '.' + firstLeftCousin.nodeValue.trim());
      if (raiAmount.split('.').length > 1) {
        firstLeftCousin.nodeValue = raiAmount.split('.')[1];
        secondLeftCousin.nodeValue = raiAmount.split('.')[0];
      } else {
        firstLeftCousin.nodeValue = '';
        secondLeftCousin.nodeValue = raiAmount.split('.')[0];
      }
    } else {
      const raiAmount = fiatToRai(firstLeftCousin.nodeValue.match(regExpAmount)[0]);
      firstLeftCousin.nodeValue = raiAmount;
    }
    return;
  }


  // Search in 'nephew' left nodes
  const firstLeftBrother = getPrevSibling(currencyNode);
  if (firstLeftBrother && firstLeftBrother.firstChild && firstLeftBrother.firstChild.nodeType === currencyNode.TEXT_NODE && isAmount(firstLeftBrother.firstChild.nodeValue)) {
    const firstLeftNephew = firstLeftBrother.firstChild;
    currencyNode.nodeValue = currencyNode.nodeValue.replace(new RegExp(regExpDollar, 'gi'), RAI);

    if (containsDecimals(firstLeftNephew.nodeValue)) {
      const raiAmount = fiatToRai(firstLeftNephew.nodeValue.match(regExpAmount)[0]);
      firstLeftNephew.nodeValue = raiAmount;
      return;
    }

    const secondLeftBrother = getPrevSibling(firstLeftBrother);
    if (firstLeftBrother && firstLeftBrother.firstChild && firstLeftBrother.firstChild.nodeType === currencyNode.TEXT_NODE && isNumber(secondLeftBrother.firstChild.nodeValue, true)) {
      const secondLeftNephew = secondLeftBrother.firstChild;
      const raiAmount = fiatToRai(secondNephew.nodeValue.trim() + '.' + firstNephew.nodeValue.trim());
      if (raiAmount.split('.').length > 1) {
        firstLeftNephew.nodeValue = raiAmount.split('.')[1];
        secondLeftNephew.nodeValue = raiAmount.split('.')[0];
      } else {
        firstLeftNephew.nodeValue = raiAmount.split('.')[0];
        secondLeftNephew.nodeValue = '';
      }
    } else {
      const raiAmount = fiatToRai(firstLeftNephew.nodeValue.match(regExpAmount)[0]);
      firstLeftNephew.nodeValue = raiAmount;
    }
    return;
  }
}


/**
 * Checks if value is a valid amount
 */
function isAmount(value) {
  return new RegExp(regExpAmount, 'gi').test(value);
}


/**
 * Checks if value is a number
 */
function isNumber(value, allowCommas) {
  if (allowCommas) {
    value = value.replace(/,/g, '');
  }
  return !isNaN(value) && !isNaN(parseFloat(value));
}


/**
 * Checks if amount contains decimal part
 */
function containsDecimals(amount) {
  return amount.split('.').length === 2;
}


/**
 * Transforms price node
 */
function convertPrice(node, regExpPrice, regExpAmount) {
  node.nodeValue.match(regExpPrice).forEach(price => { 
    const raiAmount = fiatToRai(price.match(regExpAmount)[0]);
    node.nodeValue = node.nodeValue.replace(price, raiAmount + RAI);
  });
}


/**
 * Converts amount to RAI
 */
function fiatToRai(amountString) {
  const amountNumber = Number(amountString.replace(/,/g, ''));
  const minToShow = 1 / Math.pow(10, storedData.decimals);
  const raiNumber = Number(amountNumber / storedData.conversion);
  if (Math.abs(raiNumber) > 0 && Math.abs(raiNumber) < minToShow) {
    const prev = raiNumber < 0 ? '>-' : '<';
    return prev + minToShow;
  } 
  return raiNumber.toLocaleString('en-US', { maximumFractionDigits: storedData.decimals, minimumFractionDigits: storedData.decimals })
}


/**
* Gets next sibling node, skipping space nodes
*/
function getNextSibling(node) {
  nextSibling = node.nextSibling;

  while(nextSibling && nextSibling.nodeType === node.TEXT_NODE && nextSibling.nodeValue.trim() === '') {
    nextSibling = nextSibling.nextSibling;
  }

  return nextSibling;
}

/**
* Gets previous sibling node, skipping space nodes
*/
function getPrevSibling(node) {
  prevSibling = node.previousSibling;

  while(prevSibling && prevSibling.nodeType === node.TEXT_NODE && prevSibling.nodeValue.trim() === '') {
    prevSibling = prevSibling.previousSibling;
  }

  return prevSibling;
}

const defaultPreferences = {
  decimals: 2,
  refreshConversionTime: 300,
  enabled: true,
  marketPrice: false
}

let storedData;
let conversionInterval;

/**
 * Stores default preferences on extension intalled
 */
chrome.runtime.onInstalled.addListener(reason => {
  if (reason !== chrome.runtime.OnInstalledReason.INSTALL) { return }
  chrome.storage.sync.set({ data: defaultPreferences });
});


/**
 * Gets stored preferences
 */
chrome.storage.sync.get('data', (res) => {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }

  if (res.data) {
    storedData = res.data;
  } else {
    storedData = defaultPreferences;
  }

  updateConversion();
  conversionInterval = setInterval(async () => {
    updateConversion();
  }, storedData.refreshConversionTime * 1000);
});


/**
 * Runs foreground script on page loaded
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^(http|file)/.test(tab.url)) {    
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['./foreground.js']
    })
    .catch(err => console.log(err)); 
  }
});


/**
 * Listens to preferences updates sent from the popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.refreshConversionTime != storedData.refreshConversionTime) {
    clearInterval(conversionInterval);
    conversionInterval = setInterval(async () => {
      updateConversion();
    }, message.refreshConversionTime * 1000);
  }

  storedData = message;

  // Forward changes to the foreground
  chrome.tabs.query({}, tabs => {
    for (let i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, storedData);
    }
  });
});


/**
 * Updates the conversion rate RAI/USD
 */
async function updateConversion() {
  const retrievedConversion = storedData.marketPrice ? await getMarketPrice() : await getRedemptionPrice();

  if (retrievedConversion) {
    storedData.conversion = retrievedConversion;

    // Store current conversion
    chrome.storage.sync.set({ data: storedData });

    // Send new conversion to the popup
    chrome.runtime.sendMessage({ conversion: retrievedConversion });

    // Send new conversion to the foreground
    chrome.tabs.query({}, tabs => {
      for (let i = 0; i < tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, storedData)
      }
    });
  }
}


/**
 * Gets current market price form CoinGecko API 
 * https://www.coingecko.com/api/documentations/v3
 */
 async function getMarketPrice() {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=rai&vs_currencies=usd')
  .catch(err => { 
    console.log(err);
    return null;
  });

  if (response.ok) {
    const json = await response.json();
    return json.rai.usd;
  } else {
    return null;
  }
}


/**
 * Gets last redemption price form RAI subgraph API
 * https://docs.reflexer.finance/api/api-endpoints
 */
async function getRedemptionPrice() {
  const data = JSON.stringify({
    query: `{
              systemState(id: "current") {
                currentRedemptionPrice {
                  value
                }
              }
            }`
  });

  const response = await fetch(
    'https://api.thegraph.com/subgraphs/name/reflexer-labs/rai-mainnet',
    {
      method: 'post',
      body: data,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    }
  )
  .catch(err => { 
    console.log(err);
    return null;
  });

  if (response.ok) {
    const json = await response.json();
    return json.data.systemState.currentRedemptionPrice.value;
  } else {
    return null;
  }
}




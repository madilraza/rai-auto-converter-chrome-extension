# RAI Auto-Converter

<p  align="center">

<img  style="text-align: center;"  src="/images/icon128.png">

</p>


Extension for Chromium based browsers to automatically convert USD to [RAI](https://reflexer.finance/).

  
It has been developed in pure JS, without external dependencies, and following the [Chrome Developers best practices](https://developer.chrome.com/docs/webstore/best_practices/), which include using the latest [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-overview/). 
  

## Installation

The extension has been submitted for publication to the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions) and is currently in the review phase.

To install the extension locally:
1. [**Download**](https://github.com/JairoFra/rai-auto-converter-chrome-extension/archive/refs/heads/master.zip) the repository and unpack it.
2.  Depending on the browser, go to  **chrome://extensions/**, **edge://extensions/**, **brave://extensions/** or **opera://extensions/**.
3.  Turn on  **Developer mode**.
4.  Click  **Load unpacked**.

## Features

### Extensive range of expressions detected
Examples:
* 1 $
* $ 1
* 1 USD
* 1 U.S.D.
* -1 US$
* 1 U.S.$
* 1 US $
* 1 U.S. $
* USD 1
* U.S.D. 1
* US$ 1
* U.S.$ 1
* US $ 1
* U.S. $ 1
* -1 us dollars
* 1 US Dollar
* 1 Dollars
* 1 DOLLAR

### Conversion for small amounts
If the result of the conversion is greater than 0, but the decimal part is not to be shown, it will be displayed as "lower than" or "greater than" the smallest amount able to be shown. 

Examples:
| Result of conversion| Decimal places | Generated output |  Incorrect output |
| ---------- | --------- | --------- | --------|
| 0.0033| 2 | <0.01 RAI | 0.00 RAI |
| -0.00041| 3 | >-0.001 RAI | -0.000 RAI |

### Amounts and symbols in different nodes
It detects amount and symbol in different nodes. This includes:
* Amount and symbol at same level
* Amount at a higher level than symbol
* Amount at a lower level than symbol
* Whole and decimal part of amount in different nodes
* Nodes separated by spaces or together
* Amount present at right or left of the symbol (depending on the validity of the format)


![screenshot1](/screenshots/screenshot1.gif)

### Detection of new nodes and changes in existing nodes
![screenshot2](/screenshots/screenshot2.gif)

### Ability to enable and disable transformation in real time
Enabling the automatic transformation will transform the current prices from USD to RAI without the need of refreshing the page.
Disabling the automatic transformation will stop detecting new changes in the page without the need of refreshing it.


## Testing
A html file with different examples can be found [here](https://htmlpreview.github.io/?https://github.com/JairoFra/rai-auto-converter-chrome-extension/blob/master/test/test.html).  View [source code](/test/test.html).

Also, it can be tested in some websites like:
* [Amazon](https://www.amazon.com/b?node=18505442011&pd_rd_w=1ftxB&pf_rd_p=c0ea6ab5-cabd-4b35-bde7-77a8469504b6&pf_rd_r=MF7AS21Z1Z646GCNZYBB&pd_rd_r=411f30ed-d0a0-4627-9bbc-d719c932007b&pd_rd_wg=UZMwk)
* [Aliexpress](https://best.aliexpress.com/?lan=en&aff_fcid=3f8e7b9324664cd8b4d89bb0b73e85ab-1629272449570-02147-_ATQOXo&tt=CPS_NORMAL&cv=14000&aff_fsk=_ATQOXo&af=286416&aff_platform=portals-tool&sk=_ATQOXo&aff_trace_key=3f8e7b9324664cd8b4d89bb0b73e85ab-1629272449570-02147-_ATQOXo&cn=6814&dp=10283fcc33585e62c3015b1d23d961&terminal_id=1583c510f52d43e5ab49408693c15282)
* [CoinGecko](https://www.coingecko.com/en)



## Configuration options

![screenshot3](/screenshots/screenshot3.png)

#### On/Off switch
To start and stop automatic conversion of USD to RAI. Can be found at the top right corner and works in real time. 

#### Number of decimals
The number of decimals in RAI amount to be displayed in the HTML. 
* Minimum: 0
* Maximum: 18
* Default: 2

#### Type of price
The type of price to be used in order to calculate the conversion from USD to price.
* Redemption price: Fetches the last redemption price from the [RAI subgraph API](https://docs.reflexer.finance/api/api-endpoints)
* Market price: Fetches the last market price from the [CoinGecko API](https://www.coingecko.com/api/documentations/v3)
* Default: Redemption price

#### Conversion rate interval
The conversion rate is continuously updated in order to offer an accurate conversion without delays. The update interval time can be adjusted in seconds.
* Minimum: 3
* Maximum: 3600 (1 hour)
* Default: 300 (5 minutes)


## Further developments
New features to be added:
* Conversion for other currencies
* Blacklisting URLs
* New proposals from the [Reflexer Labs](https://reflexer.finance/) community


## License
Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## Issues
Please, submit any issues or proposals [here](https://github.com/JairoFra/rai-auto-converter-chrome-extension/issues).


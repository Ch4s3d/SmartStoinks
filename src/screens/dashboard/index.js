import "./styles.sass";
import React, {useState } from "react";

//FA
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSquareXmark } from "@fortawesome/free-solid-svg-icons";

//Assets
import gif from '../../assets/loading.gif'

//OpenAI
import OpenAI from "openai";

export function DashboardScreen(props) {
    const [key, setKey] = useState(0);

  return (
    <div className="DashboardScreenContainer">
        <div className="DashboardScreen">
            <div className="Header">
                <h1>Smart Stoinks</h1>
                <p>Stock Predictions</p>
            </div>
            {Renderer({key, setKey})}
            <p className="Disclaimer">¡Este no es un verdadero consejo financiero!</p>
       </div>
    </div>
  );
}

function Renderer({key, setKey}){
    const [tickers, setTickers] = useState([]);
    const [ticker, setTicker] = useState('');
    const [apiMessage, setApiMessage] = useState('');
    const [loadingArea, setLoadingArea] = useState('');
    const [report, setReport] = useState(null);

    function UpdateTickers(){
        if(!tickers)
            setTickers([])

        if(tickers.length >=3)
            return
        
        setTickers(prevState => [...prevState, ticker])
        setTicker('')
    }

    function Submit(){
        setKey(1)
        fetchStockData({tickers, setApiMessage, setLoadingArea, ReportReady})
    }

    function ReportReady(data){
        setReport(data)
        setKey(2)
    }

    switch (key) {
        case 1:
            return (
                <>
                    <div className="Loading">
                        <img src={gif} alt="loading..." />
                        <p>{apiMessage}</p>
                    </div>
                    {loadingArea !== + '' ?
                    <div className="Toast">
                        <FontAwesomeIcon icon={faSquareXmark}/>
                        <p>{loadingArea}</p>
                    </div> : null}
                    
                </>
            );
        case 2:
            return(
                <div className="Report">
                    <h3>Tu reporte</h3>
                    <p>{report}</p>
                </div>
            )
    
        default:
            return (
            <div className="Body">
                <p>Agregue hasta 3 tickers para obtener un informe de predicciones bursátiles súper preciso</p>
                <div className="Input">
                    <input placeholder="MSFT" value={ticker} onChange={(e) => setTicker(e.target.value)}></input>
                    <button onClick={UpdateTickers} disabled={ticker.length !== +4}><FontAwesomeIcon icon={faPlus}/></button>
                </div>
                <div className="Tickers">
                
                {tickers ? tickers.map(function(item, i) {
                    return (
                        <div className="Ticker" key={i}>
                            <p>{item}</p>
                        </div>
                    )
                }) : <p>Tus tickers aparecerán aquí...</p>}
                </div>
                <button className="Submit" disabled={tickers.length <=0} onClick={Submit}>GENERAR REPORTE</button>
                <p>Siempre correcto 15% del tiempo</p>
            </div>
        )
    }
}

function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getDateNDaysAgo(n) {
    const now = new Date(); // current date and time
    now.setDate(now.getDate() - n); // subtract n days
    return formatDate(now);
}

export const dates = {
    startDate: getDateNDaysAgo(3), // alter days to increase/decrease data set
    endDate: getDateNDaysAgo(1) // leave at 1 to get yesterday's data
}

async function fetchStockData({tickers, setApiMessage, setLoadingArea, ReportReady}) {
    try {
        const stockData = await Promise.all(tickers.map(async (ticker) => {
            const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${process.env.REACT_APP_POLYGON_API_KEY}`
            const response = await fetch(url)
            const data = await response.text()
            const status = await response.status
            if (status === 200) {
                setApiMessage('Creating report...')
                return data
            } else {
                setLoadingArea('There was an error fetching stock data.')
            }
        }))
        let stockDataJoined = stockData.join('')
        fetchReport({stockDataJoined, ReportReady, setLoadingArea})
    } catch(err) {
        setLoadingArea('There was an error fetching stock data.')
        console.error('error: ', err)
    }
}

async function fetchReport({stockDataJoined, ReportReady, setLoadingArea}) {
     const messages = [
        {
            role: 'system',
            content: 'You are a trading guru. Given data on share prices over the past 3 days, write a report of no more than 150 words describing the stocks performance and recommending whether to buy, hold or sell.'
        },
        {
            role: 'user',
            content: stockDataJoined
        }
    ]

    try {
        const openai = new OpenAI({
            dangerouslyAllowBrowser: true,
            apiKey: process.env.REACT_APP_OPENAI_API_KEY
        })
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: 1.1
        })
        ReportReady(response.choices[0].message.content)

    } catch (err) {
        console.log(err)
        setLoadingArea('Unable to access AI. Please refresh and try again')
    }
}
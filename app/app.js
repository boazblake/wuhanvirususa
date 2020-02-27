import {
  divide,
  filter,
  pluck,
  compose,
  propEq,
  zipWith,
  multiply
} from "ramda"

import M from "moment"

const toChartData = (states) => {
  let lastUpdated = M(states[0].lastUpdate).format("YYYY-MM-DD")
  let lat = pluck("lat", states)
  let lon = pluck("long", states)
  let text = pluck("text", states)
  let markerSize = zipWith(
    divide,
    pluck("deaths", states),
    pluck("confirmed", states)
  )
  return [
    {
      type: "scattergeo",
      locationmode: "USA-states",
      lat,
      lon,
      hoverinfo: "text",
      text,
      lastUpdated,
      marker: {
        size: markerSize.map(multiply(100)),
        line: {
          color: "black",
          width: 2
        }
      }
    }
  ]
}

const formatState = ({
  provinceState,
  lat,
  long,
  confirmed,
  recovered,
  deaths,
  active,
  lastUpdate
}) => ({
  lat,
  long,
  text: `${provinceState}: confirmed: ${confirmed}, recovered: ${recovered}, deaths: ${deaths}, active: ${active}`,
  confirmed,
  recovered,
  deaths,
  active,
  lastUpdate
})

const filterForUSA = (countries) =>
  filter(propEq("countryRegion", "US"), countries)

const toPlot = (dom) => (details) => {
  var USLayout = {
    title: `2020 US City WuHan virus Epidemic; last Updated: ${details[0].lastUpdated}`,
    showlegend: false,
    geo: {
      scope: "usa",
      projection: {
        type: "albers usa"
      },
      showland: true,
      landcolor: "rgb(217, 217, 217)",
      subunitwidth: 1,
      countrywidth: 1,
      subunitcolor: "rgb(255,255,255)",
      countrycolor: "rgb(255,255,255)"
    }
  }
  Plotly.newPlot(dom, details, USLayout)
}

const formatLocation = (locations) => filterForUSA(locations).map(formatState)

const getDetailsAndPlot = ({ dom, mdl, url }) => {
  const onSuccess = (mdl) => (details) => {
    mdl.data.details = compose(
      toPlot(dom),
      toChartData,
      formatLocation
    )(details)
  }
  const onError = (mdl) => (err) => {
    mdl.err = err
  }

  m.request(url).then(onSuccess(mdl), onError(mdl))
}

const WuhanCrisis = () => {
  return {
    oncreate: ({ dom, attrs: { mdl } }) => {
      getDetailsAndPlot({ dom, mdl, url: mdl.data.wuhan.confirmed.detail })
    },
    view: () => m(".container")
  }
}

const IsLoading = m(
  "svg[xmlns='http://www.w3.org/2000/svg'][xmlns:xlink='http://www.w3.org/1999/xlink'][width='200px'][height='200px'][viewBox='0 0 100 100'][preserveAspectRatio='xMidYMid']",
  {
    style: {
      margin: "auto",
      background: "rgb(241, 242, 243)",
      display: "block",
      "shape-rendering": "auto"
    }
  },
  m(
    "path[d='M10 50A40 40 0 0 0 90 50A40 42 0 0 1 10 50'][fill='#85a2b6'][stroke='none'][transform='rotate(17.5738 50 51)']",
    m(
      "animateTransform[attributeName='transform'][type='rotate'][dur='1s'][repeatCount='indefinite'][keyTimes='0;1'][values='0 50 51;360 50 51']"
    )
  )
)

const loadWuhanVirusData = (mdl) => {
  const onError = (mdl) => (err) => (mdl.err.wuhan = err)
  const onSuccess = (mdl) => (data) => (mdl.data.wuhan = data)
  m.request("https://covid19.mathdro.id/api").then(onSuccess(mdl), onError(mdl))
}

const wuhanStyle = (mdl) => ({
  // backgroundImage: `url(${mdl.data.wuhan.image}) center`,
  height: "100vh",
  width: "100vw"
})
const WuhanVirus = (mdl) => {
  return {
    oninit: () => loadWuhanVirusData(mdl),
    view: () =>
      mdl.data.wuhan
        ? m(".container", { style: wuhanStyle(mdl) }, [m(WuhanCrisis, { mdl })])
        : IsLoading
  }
}

export default WuhanVirus

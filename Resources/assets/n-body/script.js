// Global variables
var plotOrbit = true 
var plotClassic = false
var plotRandom = false
var plotRandom3Body = false
var plotIndex = 0
var delay = 10
var tailLength = 1;
var nBodies = 256;

/*
 * Earth - Sun Orbit Plot
 * Taken from Numerics tutorial
 */

const G = 6.67e-11;
const Msun = 2e30;
const AU = 1.5e11;
const v0 = Math.sqrt(G * Msun / AU); // SI

function dR(r, v) {
  const dv = [-G * Msun / Math.pow(r[0] ** 2 + r[1] ** 2, 3 / 2) * r[0], -G * Msun / Math.pow(r[0] ** 2 + r[1] ** 2, 3 / 2) * r[1]];
  const dr = [...v];
  return [dr, dv];
}

// initialize system
let r = [-AU, 0];
const theta = Math.atan2(r[1], r[0]);
let v = [-v0 * Math.sin(theta), v0 * Math.cos(theta)];

const t = Array.from({ length: 1001 }, (_, i) => i / 100 + 0.0); // years
const yearSec = 365 * 24 * 3600;
const dt = (t[1] - t[0]) * yearSec; // s
const x4Plot = Array.from({ length: t.length }, () => 0);
const y4Plot = Array.from({ length: t.length }, () => 0);

// integrate using RK4!
for (let i = 0; i < t.length; i++) {
  const k1 = dR(r, v).map(x => x.map(y => y * dt));
  const k2 = dR(r.map((ri, j) => ri + k1[0][j] / 2), v.map((vi, j) => vi + k1[1][j] / 2)).map(x => x.map(y => y * dt));
  const k3 = dR(r.map((ri, j) => ri + k2[0][j] / 2), v.map((vi, j) => vi + k2[1][j] / 2)).map(x => x.map(y => y * dt));
  const k4 = dR(r.map((ri, j) => ri + k3[0][j]), v.map((vi, j) => vi + k3[1][j])).map(x => x.map(y => y * dt));
  r = r.map((ri, j) => ri + (k1[0][j] + 2 * k2[0][j] + 2 * k3[0][j] + k4[0][j]) / 6);
  v = v.map((vi, j) => vi + (k1[1][j] + 2 * k2[1][j] + 2 * k3[1][j] + k4[1][j]) / 6);
  x4Plot[i] = r[0];
  y4Plot[i] = r[1];
}

// make data for plot
var sun = { x: 0, y: 0 };
const earth = { x: x4Plot.map(x => x / AU), y: y4Plot.map(y => y / AU) };
const circle = { x: Array.from({ length: 1001 }, (_, i) => Math.cos(i / 100 * 2 * Math.PI)), y: Array.from({ length: 1001 }, (_, i) => Math.sin(i / 100 * 2 * Math.PI)) };

/*
 * Generic Functions 
 * 
 *
 */

function deltaR(coords, masses, nBodies, G) {
    let x = coords[0];
    let y = coords[1];
    let vx = coords[2];
    let vy = coords[3];

    let delta = math.clone(coords);

    for (let n = 0; n < nBodies; n++) {
        let xn = x[n];
        let yn = y[n];
        let deltaVx = 0.0;
        let deltaVy = 0.0;

        for (let i = 0; i < nBodies; i++) {
            if (i !== n) {
                let sep = Math.sqrt(Math.pow(xn - x[i], 2) + Math.pow(yn - y[i], 2)); // Euclidean distance
                deltaVx -= G * masses[i] * (xn - x[i]) / Math.pow(sep, 3);
                deltaVy -= G * masses[i] * (yn - y[i]) / Math.pow(sep, 3);
            }
        }

        delta[2][n] = deltaVx;
        delta[3][n] = deltaVy;
    }

    delta[0] = vx;
    delta[1] = vy;

    return delta;
}

function detectCollisionsEscape(coords, deltaT, maxSep) {
  const [x, y, vx, vy] = coords;
  const V = vx.map((v, i) => Math.sqrt(v ** 2 + vy[i] ** 2));
  const R = V.map(v => v * deltaT);
  let collision = false, collisionInds = null, escape = false, escapeInd = null;

  for (let n = 0; n < x.length; n++) {
      const rn = R[n], xn = x[n], yn = y[n];
      for (let i = 0; i < x.length; i++) {
          if (i !== n) {
              const minSep = rn + R[i];
              const sep = Math.sqrt((xn - x[i]) ** 2 + (yn - y[i]) ** 2);
              if (sep < minSep) {
                  collision = true;
                  collisionInds = [n, i];
              } else if (sep > maxSep) {
                  escape = true;
                  escapeInd = n;
                  return [collision, collisionInds, escape, escapeInd];
              }
          }
      }
  }
  return [collision, collisionInds, escape, escapeInd];
}



function step(coords, masses, deltaT, nBodies = 3, G = 6.67408313131313e-11) {
    let k1 = math.multiply(deltaT, deltaR(coords, masses, nBodies, G));
    let k2 = math.multiply(deltaT, deltaR(math.add(coords, math.multiply(k1, 0.5)), masses, nBodies, G));
    let k3 = math.multiply(deltaT, deltaR(math.add(coords, math.multiply(k2, 0.5)), masses, nBodies, G));
    let k4 = math.multiply(deltaT, deltaR(math.add(coords, k3), masses, nBodies, G));

    coords = math.add(coords, math.multiply(math.add(k1, math.multiply(2.0, k2), math.multiply(2.0, k3), k4), 1/6));

    return coords;
}

function nBodyStep(coords, masses, deltaT, maxSep, nBodies, G = 6.67408313131313e-11) { // Similar to our step function before, but keeping track of collisions
  coords = step(coords, masses, deltaT, nBodies, G); // Update the positions as we did before
  //console.log(detectCollisionsEscape(coords, deltaT, maxSep));
  let [collision, collisionInds, escape, escapeInd] = detectCollisionsEscape(coords, deltaT, maxSep); // Detect collisions/escapes


  if (collision) { // Do inelastic collision and delete extra body (2 -> 1)
    const [i1, i2] = collisionInds;
      const [x1, x2] = [coords[0][i1], coords[0][i2]];
      const [y1, y2] = [coords[1][i1], coords[1][i2]];
      const [vx1, vx2] = [coords[2][i1], coords[2][i2]];
      const [vy1, vy2] = [coords[3][i1], coords[3][i2]];
      const [px1, px2] = [masses[i1] * vx1, masses[i2] * vx2];
      const [py1, py2] = [masses[i1] * vy1, masses[i2] * vy2];
      const px = px1 + px2;
      const py = py1 + py2;
      const newM = masses[i1] + masses[i2];
      const vfx = px / newM;
      const vfy = py / newM;
      coords[0][i1] = (x1 * masses[i1] + x2 * masses[i2]) / (masses[i1] + masses[i2]); // Center of mass
      coords[1][i1] = (y1 * masses[i1] + y2 * masses[i2]) / (masses[i1] + masses[i2]);
      coords[2][i1] = vfx;
      coords[3][i1] = vfy;
      coords[0].splice(i2, 1);
      coords[1].splice(i2, 1);
      coords[2].splice(i2, 1);
      coords[3].splice(i2, 1);
      masses[i1] = newM;
      masses.splice(i2, 1);
      nBodies--;
  }
  // Could also implement condition for escape where we stop calculating forces but I'm too lazy for now
  return [coords, masses, nBodies, collision, collisionInds, escape, escapeInd];
}

function uniform(min, max) {
  return Math.random() * (max - min) + min;
}

function deepCopyCoordsArray(arr) {
  return arr.map(innerArr => innerArr.slice());
}

function genNBodyResults(nBodies, tStop, nTPts, nBodiesStop = 10, G = 6.67408313131313e-11) {

  var btn = document.getElementById("startSim3");
  // Set button text to Solving
  var prevText = btn.innerHTML;
  btn.innerHTML = "Solving...";

  let coords = [Array(nBodies).fill(0), Array(nBodies).fill(0), Array(nBodies).fill(0), Array(nBodies).fill(0)];
  const Mstar = 2e30;
  const Mp = Mstar / 1e4;

  for (let i = 0; i < nBodies; i++) { // Initialize coordinates on ~Keplerian orbits
      let accept = false;
      let r = null;
      while (!accept) { // Prevent a particle from spawning within 0.2 AU too close to "star"
          r = Math.random() * 2 * 1.5e11; // Say radius of 2 AU
          if (r / 1.5e11 > 0.2) {
              accept = true;
          }
      }
      const theta = uniform(0, 2 * Math.PI);
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const v = Math.sqrt(G * Mstar / r);
      const perturbedV = v + v / 1000 * uniform(-1, 1); // Perturb the velocities ever so slightly
      const vTheta = Math.atan2(y, x);
      coords[0][i] = x;
      coords[1][i] = y;
      coords[2][i] = -perturbedV * Math.sin(vTheta);
      coords[3][i] = perturbedV * Math.cos(vTheta);
  }

  //console.log('Initial coords:', coords);


  let masses = Array(nBodies).fill(Mp); // Initialize masses
  masses[0] = Mstar; // Make index one special as the central star
  coords[0][0] = 0;
  coords[1][0] = 0;
  coords[2][0] = 0;
  coords[3][0] = 0; // Initialize central star at origin with no velocity
  const yearSec = 365 * 24 * 3600;
  const time = Array.from({ length: nTPts }, (_, i) => i * tStop / (nTPts - 1) * yearSec); // Years -> s
  let t = time[0];
  const deltaT = time[1] - time[0];
  let tInd = 0;
  const coordsRecord = [deepCopyCoordsArray(coords)];
  const massRecord = [masses.slice()]; // Initialize records with initial conditions


  while (tInd < nTPts && nBodies > nBodiesStop) {
    //console.log('Initial coords:', coords);
    [coords, masses, nBodies] = nBodyStep(coords, masses, deltaT, 10 * 1.5e11, nBodies, G); // Update
    coordsRecord.push(deepCopyCoordsArray(coords));
    massRecord.push(masses.slice()); // Add to records
    tInd++;
    t = time[tInd];
    //console.log(`currently at t = ${(t / yearSec).toFixed(2)} years\r`);
  }
  console.log(`final time = ${time[tInd] / yearSec} years with ${nBodies} bodies remaining`);

  // Set button text to Start Simulation
  btn.innerHTML = prevText;

  return [coordsRecord, massRecord, time.slice(0, tInd + 1)];
}


function initCondGen(nBodies, vRange = [-7e3, 7e3], posRange = [-35, 35]) {
    const m = Array.from({length: nBodies}, () => Math.random() * 1500 / 10);
    
    const rad = m.map(x => Math.pow(x, 0.8));
    const minV = vRange[0], maxV = vRange[1];
    const minPos = posRange[0], maxPos = posRange[1];
    const posList = [];

    function checkPos(randPos, n, posList, rad) {
        for (let i = 0; i < n - 1; i++) {
            const dist = Math.sqrt(Math.pow(posList[i][0] - randPos[0], 2) + Math.pow(posList[i][1] - randPos[1], 2));
            if (dist * 1.5e11 < (rad[n] + rad[i])) {
                return false;
            }
        }
        return true;
    }

    function genPos(nBodies, posList, rad, minPos, maxPos) {
        posList.push([Math.random() * (maxPos - minPos) + minPos, Math.random() * (maxPos - minPos) + minPos]);
        for (let n = 1; n < nBodies; n++) {
            let acceptPos = false;
            while (acceptPos === false) {
                const randPos = [Math.random() * (maxPos - minPos) + minPos, Math.random() * (maxPos - minPos) + minPos];
                acceptPos = checkPos(randPos, n, posList, rad);
                if (acceptPos === true) {
                    posList.push(randPos);
                }
            }
        }
        return posList;
    }

    const pos = genPos(nBodies, posList, rad, minPos, maxPos).map(x => x.map(y => y * 1.5e11));
    const coords = [new Array(nBodies).fill(0), new Array(nBodies).fill(0), new Array(nBodies).fill(0), new Array(nBodies).fill(0)];
    const v = [];

    for (let i = 0; i < nBodies; i++) {
        coords[0][i] = pos[i][0];
        coords[1][i] = pos[i][1];
        const V = [Math.random() * (maxV - minV) + minV, Math.random() * (maxV - minV) + minV];
        v.push(V);
        coords[2][i] = V[0];
        coords[3][i] = V[1];
    }

    return {m: m.map(x => x * 2e30), rad: rad.map(x => x * 7e8), coords: coords};
}

function random3BodySimSolver(tStop, nTPts, nBodiesStop=2, G=6.674e-11) {
  let initConditions = initCondGen(3,[-7e3, 7e3],[-5, 5]);
  let myMasses = initConditions.m;
  let myCoords = initConditions.coords;

  let nBodies3B = 3;

  const yearSec = 365 * 24 * 3600;

  const time = Array.from({ length: nTPts }, (_, i) => i * tStop / (nTPts - 1) * yearSec); // Years -> s
  let t = time[0];
  const deltaT = time[1] - time[0];
  let tInd = 0;
  const coordsRecord = [deepCopyCoordsArray(myCoords)];
  const massRecord = [myMasses.slice()]; // Initialize records with initial conditions

  while (tInd < nTPts && nBodies3B > nBodiesStop) { 
    [myCoords, myMasses, nBodies3B] = nBodyStep(myCoords, myMasses, deltaT, 10 * 1.5e11, nBodies3B, G); // Update
    coordsRecord.push(deepCopyCoordsArray(myCoords));
    massRecord.push(myMasses.slice()); // Add to records
    tInd++;
    t = time[tInd];
  }

  console.log(nBodies3B)
  
  return [coordsRecord, massRecord, time.slice(0, tInd + 1)];

}


function calculateAndPlot() {
  try {
    Plotly.purge("plot");
  } catch (e) {
    console.log(e);
  }

  if (plotOrbit===true) {
    let traceSun = {
      x: [sun.x],
      y: [sun.y],
      mode: "markers",
      marker: {
        symbol: "star",
        size: 10,
        color: "gold",
      },
      name: "Sun",
    };

    const traceEarth = {
      x: earth.x,
      y: earth.y,
      mode: "lines",
      line: {
        color: "white"
      },
      name: "Earth",
    };

    const traceOrbit = {
      x: circle.x,
      y:circle.y,
      mode: "lines",
      line: {
        color: "crimson",
        dash: "dash"
      },
      name: "1 AU Circle",
    };

    const earthSunLayout = {
      title: "Earth-Sun Orbit",
      xaxis: {
        title: "x [AU]",
        range: [-1.1,1.1],
        showgrid: true,
        gridcolor: "rgba(255,255,255,0.5)",
        gridwidth: 1,
        zeroline: true,
        tickmode: "auto",
        nticks: 5,
      },
      yaxis: {
        title: "y [AU]",
        range: [-1.1,1.1],
        showgrid: true,
        gridcolor: "rgba(255,255,255,0.5)",
        gridwidth: 1,
        zeroline: false,
        tickmode: "auto",
        nticks: 5,
      },
      margin: {
        l: 50,
        r: 50,
        b: 50,
        t: 50,
        pad: 4,
      },
      paper_bgcolor: "black",
      plot_bgcolor: "black",
    };
    Plotly.newPlot("plot",[traceSun,traceEarth,traceOrbit], earthSunLayout);
  } else if (plotRandom==true) {

    var [coordsRecordR, _, tR] = genNBodyResults(nBodies,1,nBodies*2);
    //console.log(coordsRecordR);
    const yearSec = 365 * 24 * 3600;

    function createFrame(coordsR) {
      if (!coordsR || !coordsR[0] || !coordsR[1]) {
          return [];
      }
  
      const traceCentralStar = {
          x: [coordsR[0][0] / 1.5e11],
          y: [coordsR[1][0] / 1.5e11],
          mode: 'markers',
          type: 'scatter',
          name: 'Central star',
          marker: { color: 'gold', symbol: 'star', size: 10 },
      };
  
      const xCoords = coordsR[0].slice(1).map(x => x / 1.5e11);
      const yCoords = coordsR[1].slice(1).map(y => y / 1.5e11);

      const traceOtherBodies = {
          x: xCoords,
          y: yCoords,
          mode: 'markers',
          type: 'scatter',
          name: '',
          marker: { color: 'dodgerblue', symbol: 'circle', size: 2 },
      };
  
      return [traceCentralStar, traceOtherBodies];
  }
  

  function createLayout(i) {
    return {
        title: {
            text: `N-Body Problem`,//= ${Number(t[i] / yearSec).toFixed(3)} years`,
            x: 0.03,
            y: 0.97,
            xanchor: 'left',
            yanchor: 'top',
            font: { size: 14 },
        },
        xaxis: { title: 'x [AU]', range: [-2.1, 2.1] },
        yaxis: { title: 'y [AU]', range: [-2.1, 2.1], scaleanchor: 'x', scaleratio: 1 },
        showlegend: false,
        margin: { l: 60, r: 40, t: 40, b: 40 },
        //width: 800,
        //height: 800,
        plot_bgcolor: 'black',
    };
}

  function animateNBodyProblem() {
  const nFrames = tR.length;

  for (let i = 0; i < nFrames; i++) {
      const frameData = createFrame(coordsRecordR[i]);
      const layout = createLayout(i);
      //Plotly.newPlot(plotDiv, frameData, layout);
      try {
        Plotly.animate("plot", {
        data: frameData, layout: layout
      }, {
        staticPlot: true,
        transition: {
          duration: 0,
        },
        frame: {
          duration: 0,
          redraw: false,
        }
      });
    } catch (err) {
      Plotly.newPlot('plot', frameData, layout);
    }
  }
}

animateNBodyProblem();


  } else if (plotRandom3Body==true) {
    let [coordsRecord3, _, t3] = random3BodySimSolver(1,1000);

    const yearSec = 365 * 24 * 3600;

    function createFrame(coords3) {
      if (!coords3 || !coords3[0] || !coords3[1]) {
          return [];
      }
  
      const xCoords = coords3[0].slice(0).map(x => x / 1.5e11);
      const yCoords = coords3[1].slice(0).map(y => y / 1.5e11);

      const traceOtherBodies = {
          x: xCoords,
          y: yCoords,
          mode: 'markers',
          type: 'scatter',
          name: '',
          marker: { color: 'dodgerblue', symbol: 'circle', size: 5 },
      };
  
      return [traceOtherBodies];
    }

    function createLayout(i) {
      return {
          title: {
              text: `3-Body Problem`,//= ${Number(t[i] / yearSec).toFixed(3)} years`,
              x: 0.03,
              y: 0.97,
              xanchor: 'left',
              yanchor: 'top',
              font: { size: 14 },
          },
          xaxis: { title: 'x [AU]' },
          yaxis: { title: 'y [AU]', scaleanchor: 'x', scaleratio: 1 },
          showlegend: false,
          margin: { l: 60, r: 40, t: 40, b: 40 },
          //width: 800,
          //height: 800,
          plot_bgcolor: 'black',
      };
    }

    function animate3BodyProblem() {
      const nFrames = t3.length;

      for (let i = 0; i < nFrames; i++) {
          const frameData = createFrame(coordsRecord3[i]);
          const layout = createLayout(i);
          //Plotly.newPlot(plotDiv, frameData, layout);
          try {
            Plotly.animate("plot", {
            data: frameData, layout: layout
          }, {
            staticPlot: true,
            transition: {
              duration: 0,
            },
            frame: {
              duration: 0,
              redraw: false,
            }
          });
        } catch (err) {
          Plotly.newPlot('plot', frameData, layout);
        }
      }
    }

    animate3BodyProblem();

  } else if (plotClassic==true) {
    // Initial conditions setup
    let M = [1, 1, 1];
    let x = [-0.97000436, 0.0, 0.97000436];
    let y = [0.24208753, 0.0, -0.24208753];
    let vx = [0.4662036850, -0.933240737, 0.4662036850];
    let vy = [0.4323657300, -0.86473146, 0.4323657300];
    let Ei = -1 / Math.sqrt(Math.pow(2 * 0.97000436, 2) + Math.pow(2 * 0.24208753, 2)) - 2 / Math.sqrt(Math.pow(0.97000436, 2) + Math.pow(0.24208753, 2)) + 0.5 * (math.sum(math.add(math.dotPow(vx, 2), math.dotPow(vy, 2))));

    function linspace(start, stop, num) {
        const step = (stop - start) / (num - 1);
        return Array.from({length: num}, (_, i) => start + (step * i));
    }

    let coords = [x, y, vx, vy];
    const time = linspace(0, 6.3259, 1001);
    let deltaT = time[1] - time[0];

    let X = math.zeros(3, time.length).toArray();
    let Y = math.zeros(3, time.length).toArray();
    let VX = math.zeros(3, time.length).toArray();
    let VY = math.zeros(3, time.length).toArray();

    for (let i = 0; i < time.length; i++) {
        coords = step(coords, M, deltaT, 3, 1);
        X.forEach((_, idx) => X[idx][i] = coords[0][idx]);
        Y.forEach((_, idx) => Y[idx][i] = coords[1][idx]);
        VX.forEach((_, idx) => VX[idx][i] = coords[2][idx]);
        VY.forEach((_, idx) => VY[idx][i] = coords[3][idx]);
    }

    function plotClassicFunc() {
      var tailLength = 1;
      if (plotIndex < tailLength) {
      tailLength = 0;
      } if (plotIndex > time.length) {
      plotIndex = 0;
      } else {
        tailLength = plotIndex - tailLength;
      }

      var currentIndex = plotIndex;

     try {
         time[currentIndex].toFixed(3);
      } catch (e) {
        console.log(e)
        currentIndex = 0;
      }

       const data = [
        {
            x: X[0].slice(tailLength, currentIndex),
            y: Y[0].slice(tailLength, currentIndex),
            mode: 'lines+markers',
            marker: {
                symbol: 'star',
                size: 8,
                line: { width: 0 },
            },
            line: {
                width: 2,
            },
            name: '',
        },
        {
            x: X[1].slice(tailLength, currentIndex),
            y: Y[1].slice(tailLength, currentIndex),
            mode: 'lines+markers',
            marker: {
                symbol: 'star',
                size: 8,
                line: { width: 0 },
            },
            line: {
                width: 2,
            },
            name: '',
        },
        {
            x: X[2].slice(tailLength, currentIndex),
            y: Y[2].slice(tailLength, currentIndex),
            mode: 'lines+markers',
            marker: {
                symbol: 'star',
                size: 8,
                line: { width: 0 },
            },
            line: {
                width: 2,
            },
            name: '',
        },
    ];

    // width: 1000, height: 400
    const layout = {
        title: '∞ Three-Body Problem: t = ' + time[currentIndex].toFixed(3),
        xaxis: {
            title: 'x',
            range: [-1.1,1.1]
        },
        yaxis: {
            title: 'y',
            scaleanchor: 'x',
            scaleratio: 1,
            range: [-0.5,0.5]
        },
        plot_bgcolor: 'black',
        paper_bgcolor: 'black',
        font: {
            color: 'white',
        },
    };

    try {
    Plotly.animate("plot", {
        data: data, layout: layout
      }, {
        staticPlot: true,
        transition: {
          duration: 0,
        },
        frame: {
          duration: 0,
          redraw: false,
        }
      });
      } catch (err) {
        Plotly.newPlot('plot', data, layout);
      }


    plotIndex += delay;
    if (plotClassic===true) {
      try {
        requestAnimationFrame(plotClassicFunc);
        }
      catch (err) {
        console.log(err)
      }
    }
      
    }

    plotClassicFunc();

  }
} 


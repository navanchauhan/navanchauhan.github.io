---
date: 2023-04-30 22:50
description: n-body solution generator and solver
tags: astrophysics, mathematics
---

# n-body solution generator

This post requires JavaScript to be viewed properly :(

Adapted from the Numerics Tutorial - [kirklong/ThreeBodyBot](https://github.com/kirklong/ThreeBodyBot/tree/master/NumericsTutorial). The Julia code has been rewritten in JavaScript.

Workflow:

* Understand the problem
* Visualise a basic orbit
* Solve and plot the classic figure-8 orbit
* Random n-body solution generator

**To workaround memory issues, the simulations are only run on-demand when the user clicks the respective button. Scroll down to the bottom of the page to see the results.**

## The n-body problem

The n-body problem is a classic puzzle in physics (and thus astrophysics) and mathematics that deals with predicting the motion of multiple celestial objects that interact with each other through gravitational forces. 

Imagine you are observing a *cosmic dance* between multiple celestial bodies, all tugging on one another as they move through space. The n-body problem aims to understand and predict the paths of these objects as they move through space.

When `n=2`, i.e we have only two objects, say the Earth and the Moon, we can easily apply Newtonian physics to predict their motion. However, when `n>2`, the problem becomes much more difficult to solve analytically.[1] This is because each object feels the gravitational pull from all other objects, and thus the equations of motion become coupled and non-linear. 

As the number of objects increases, finding an exact solution becomes impossible, and we rely on analytical approximations.

## Visualising a basic orbit

If we want to create a n-body simulation in our browser, we need to figure out how we are going to visualise the motion of the objects. There are a few ways to do this, but the easiest is to use Plotly.js, a JavaScript library for creating interactive graphs. (An alternative is to use the HTML5 canvas element).

```javascript
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
```


This code simulates the orbit of Earth around the Sun, using a numerical method called the Runge-Kutta 4th order (RK4) method.

First, we define some constants:

G: the gravitational constant (6.67e-11 N m²/kg²)
Msun: the mass of the Sun (2e30 kg)
AU: an astronomical unit, the average distance between Earth and Sun (1.5e11 m)
v0: the initial velocity of Earth, calculated from its distance to the Sun
Next, the function dR takes the position r and velocity v of Earth as input and returns the rate of change in position (dr) and the rate of change in velocity (dv) using the gravitational force formula.

We then initialize the position r and velocity v of Earth, and create an array t that represents time in years, divided into 1001 steps. We also define yearSec as the number of seconds in a year and dt as the time step in seconds.

Now, we integrate the Earth's motion using the RK4 method. For each time step, we calculate the rates of change for position and velocity (k1, k2, k3, k4) and update Earth's position and velocity based on these. We store the updated position in x4Plot and y4Plot.

Finally, we normalize the position data by dividing it by the astronomical unit (AU) to make it more visually meaningful. We also create a circle for reference, which represents a perfect circular orbit. The code ends with the data for the Sun's position, Earth's orbit, and the reference circle ready to be plotted.

### Plotting the orbit

Now that we have the data for the Sun's position, Earth's orbit, and the reference circle, we can plot them using Plotly.js.

```javascript
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
```

## Figure of 8 orbit


The figure of 8 solution[2] in the three-body problem refers to a unique and special trajectory where three celestial bodies (e.g., planets, stars) move in a figure of 8 shaped pattern around their mutual center of mass. This is special because it represents a stable and periodic solution to the three-body problem, which is known for its complexity and lack of general solutions.

In the figure of 8 solution, each of the three bodies follows the same looping path, but with a phase difference such that when one body is at one end of the loop, the other two are symmetrically positioned elsewhere along the path. The bodies maintain equal distances from each other throughout their motion, and their velocities and positions are perfectly balanced to maintain this periodic motion.

The figure of 8 is interesting because:

* It is a relatively stable solution, which means that the objects continue to follow the same looping path almost indefinitely.

* It breaks down the notion that no simple periodic solutions exist for the three-body problem.

* It looks cool!

### Show me the code

The code for this simulation is very similar to the Earth-Sun orbit simulation, except that we now have three bodies instead of two. We also use a different set of initial conditions to generate the figure of 8 orbit.

```javascript

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

function step(coords, masses, deltaT, nBodies = 3, G = 6.67408313131313e-11) {
    let k1 = math.multiply(deltaT, deltaR(coords, masses, nBodies, G));
    let k2 = math.multiply(deltaT, deltaR(math.add(coords, math.multiply(k1, 0.5)), masses, nBodies, G));
    let k3 = math.multiply(deltaT, deltaR(math.add(coords, math.multiply(k2, 0.5)), masses, nBodies, G));
    let k4 = math.multiply(deltaT, deltaR(math.add(coords, k3), masses, nBodies, G));

    coords = math.add(coords, math.multiply(math.add(k1, math.multiply(2.0, k2), math.multiply(2.0, k3), k4), 1/6));

    return coords;
}

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
```

The `deltaR` function computes the rate of change in position and velocity of the celestial bodies based on their current positions, velocities, and masses. It accounts for the gravitational forces between all bodies.

The `step` function performs a single RK4 integration step, updating the positions and velocities of the celestial bodies. It uses `deltaR` to compute the four increments (k1, k2, k3, and k4) and then updates the coordinates accordingly.

Next, the initial conditions for the figure-8 three-body problem are set. The masses (`M`), initial positions (`x`, `y`), and initial velocities (`vx`, `vy`) are provided. `Ei` calculates the initial total energy of the system.

The `linspace` function is defined to create a linearly spaced array of time points. `coords` is an array containing the positions and velocities for all bodies. The `time` array is created using `linspace`, and `deltaT` is set as the time step.

`X`, `Y`, `VX`, and `VY` are 2D arrays that will store the positions and velocities of the celestial bodies over time. They are initialized with zeros and will be updated in the loop.

Finally, a loop iterates over each time step, updating the positions and velocities of the celestial bodies using the `step` function. The updated coordinates are stored in the `X`, `Y`, `VX`, and `VY` arrays.

### Animation?

Now that we have time-series data, we need to animate it. We can use Plotly's animate function, as this does not force a full re-render, saving us some precious GPU and CPU cycles when we are trying to run this in the browser itself

```javascript
    function plotClassicFunc() {
      var tailLength = 1;
      if (plotIndex < tailLength) {
      tailLength = 0;
      } else if (plotIndex > time.length) {
      plotIndex = 0;
      } else {
        tailLength = plotIndex - tailLength;
      }

      var currentIndex = plotIndex;

     try {
         time[currentIndex].toFixed(3);
      } catch (e) {
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
```

## "General" N-Body Solver



### Show me the code!

```javascript

function step(coords, masses, deltaT, nBodies = 3, G = 6.67408313131313e-11) {
    let k1 = math.multiply(deltaT, deltaR(coords, masses, nBodies, G));
    let k2 = math.multiply(deltaT, deltaR(math.add(coords, math.multiply(k1, 0.5)), masses, nBodies, G));
    let k3 = math.multiply(deltaT, deltaR(math.add(coords, math.multiply(k2, 0.5)), masses, nBodies, G));
    let k4 = math.multiply(deltaT, deltaR(math.add(coords, k3), masses, nBodies, G));

    coords = math.add(coords, math.multiply(math.add(k1, math.multiply(2.0, k2), math.multiply(2.0, k3), k4), 1/6));

    return coords;
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


 var [coordsRecordR, _, tR] = genNBodyResults(256,1,1001);
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
            text: `N-Body Problem: t = ${Number(t[i] / yearSec).toFixed(3)} years`,
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
        width: 800,
        height: 800,
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
```

## Playground

<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.js"></script>
<script src="/assets/n-body/script.js"></script>
<div id="main-plot-div">
<noscript>
The simulations require JavaScript to be viewed properly :(
</noscript>

<div id="plot"></div>
   
<label for="speedControl">Speed for 3-Body Visualisation</label>
<input type="range" min="1" max="20" value="10" id="speedControl">
<label for="nBodies">Number of Bodies for n-Body Simulation (5-500)</label>
<input type="range" min="5" max="500" value="256" id="nBodies">
<label for="distanceAU">Position Range for Random 3-Body Simulations (1-55)</label>
<input type="number" min="1" max="55" value="10" id="distanceAU">
<label for="vRange">Velocity Range for Random 3-Body Simulation (1-10e4)<label>
<input type="number" min="1" max="10000" value="7e3" id="vRange">

</div>
<button type="button" id="startSim1" onclick="plotEarthSun()">Sun-Earth Orbit</button>
<button type="button" id="startSim2" onclick="plotClassic3BodyProblem()">Classic 3-Body Problem</button>
<button type="button" id="startSim3" onclick="plotRandomNBodySimulation()">Random n-Body Simulation</button>
<button type="button" id="startSim4" onclick="plotRandom3BodySimulation()">Random 3-Body Simulation</button>
<script>
function clearAl() {
    plotOrbit = false;
    plotClassic = false;
    plotRandom = false;
    plotRandom3Body = false;
}

function plotEarthSun() {
    clearAl();
    plotOrbit = true;
    calculateAndPlot();
    setTimeout(function(){
        calculateAndPlot()
      }, 500);
    }

function plotClassic3BodyProblem() {
      clearAl();
      plotClassic = true;
      calculateAndPlot();
      setTimeout(function(){
        calculateAndPlot()
      }, 500);
    }

function plotRandomNBodySimulation() {
      clearAl();
      plotRandom = true;
      calculateAndPlot();
    }

  function plotRandom3BodySimulation() {
    clearAl();
    plotRandom3Body = true;
    calculateAndPlot();
  }



</script>

<script>
    document.getElementById("speedControl").addEventListener("input", (event) => {
    const speedPercentage = parseInt(event.target.value, 10);
    delay = speedPercentage; // Adjust the delay based on the trackbar value
});
    document.getElementById("nBodies").addEventListener("input", (event) => {
    nBodies = parseInt(event.target.value, 10);
    });

 </script>     


## References

1. Barrow-Green, June (2008), "The Three-Body Problem", in Gowers, Timothy; Barrow-Green, June; Leader, Imre (eds.), *The Princeton Companion to Mathematics*, Princeton University Press, pp. 726–728
2. Moore, Cristopher (1993), "Braids in classical dynamics", *Physical Review Letters*, 70 (24): 3675–3679

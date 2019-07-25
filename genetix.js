~(function(global, factory) {
  "object" === typeof exports && "undefined" !== typeof module
    ? (module.exports = factory())
    : "function" === typeof define && define.amd
    ? define(factory)
    : (global["gx"] = factory());
})(this, function() {
  "use strict";

  const gx = {};

  function init(config) {
    // Default config
    gx.sketch = undefined;
    gx.console = false;
    gx.mutationRate = 0.1;
    gx.loop = true;
    gx.graph = false;
    gx.wrap_x = false;
    gx.wrap_y = false;

    if (config) {
      Object.keys(config).forEach(k => {
        gx[k] = config[k];
      });
    }

    if (!gx.sketch || gx.sketch.constructor.name !== "p5") {
      console.warn(
        "No p5 sketch attached to Genetix. Attach a sketch in the gx.init() configuration."
      );
      return;
    }

    if (gx.graph && gx.sketch.width % 100 !== 0) {
      console.warn(
        "The graph works best with a sketch width which is a multiple of 100."
      );
    }

    gx.mutationRate = gx.sketch.constrain(gx.mutationRate, 0, 1);

    gx.generationCount = 0;
    gx.averageFitness = 0;
    gx.previousBest = 0;
    gx.previousWorst = 0;
    gx.genes = 0;

    if (gx.console) {
      console.log("Configuration:");
      console.log("Mutation rate: ", gx.mutationRate * 100, "%");
      console.log("");
    }

    if (gx.graph) {
      new p5(function(g) {
        const margin = 20;
        let last = 0;
        let best = undefined;
        let worst = undefined;
        const points = [];
        const lowest = [];
        const highest = [];

        function drawGraphBackground() {
          g.stroke(0);

          g.strokeWeight(0.5);
          g.textAlign(g.RIGHT, g.CENTER);
          g.text("0 ", margin, g.height - margin);
          g.text(".5 ", margin, g.height / 2);
          g.text("1 ", margin, margin);

          g.push();
          g.stroke(190);
          g.line(margin, g.height / 2, g.width - margin, g.height / 2);
          g.line(
            margin,
            (g.height / 2 + margin) / 2,
            g.width - margin,
            (g.height / 2 + margin) / 2
          );
          g.line(
            margin,
            (g.height / 2 + g.height - margin) / 2,
            g.width - margin,
            (g.height / 2 + g.height - margin) / 2
          );
          g.pop();

          g.textAlign(g.CENTER, g.TOP);
          const maxGen = Math.floor((g.width - margin) / margin);
          for (let i = 1; i < maxGen; i++) {
            g.text(i + " ", margin * (i + 1), g.height - margin);
            g.push();
            g.stroke(190);
            g.line(
              margin * (i + 1),
              margin,
              margin * (i + 1),
              g.height - margin
            );
            g.pop();
          }

          g.strokeWeight(2);
          g.line(margin, margin, margin, g.height - margin);
          g.line(
            margin,
            g.height - margin,
            g.width - margin,
            g.height - margin
          );
        }

        g.setup = function() {
          g.createCanvas(gx.sketch.width, 200);
        };

        g.draw = function() {
          g.background(150);

          drawGraphBackground();

          if (gx.generationCount > last) {
            const p = {
              x: margin * gx.generationCount,
              y: g.map(gx.averageFitness, 0, 1, g.height - margin, margin),
              v: gx.averageFitness
            };
            points.push(p);

            if (!worst || p.v >= best.v) best = p;

            if (!worst || p.v < worst.v || worst.v === 0) worst = p;

            lowest.push({
              x: margin * gx.generationCount,
              y: g.map(gx.previousWorst, 0, 1, g.height - margin, margin),
              v: gx.previousWorst
            });

            highest.push({
              x: margin * gx.generationCount,
              y: g.map(gx.previousBest, 0, 1, g.height - margin, margin),
              v: gx.previousBest
            });

            last++;
          }

          lowest.forEach((p, i) => {
            if (lowest[i - 1]) {
              const op = lowest[i - 1];
              g.push();
              g.strokeWeight(1);
              g.stroke(255, 50, 50);
              g.line(op.x, op.y, p.x, p.y);
              g.pop();
            }
          });
          highest.forEach((p, i) => {
            if (highest[i - 1]) {
              const op = highest[i - 1];
              g.push();
              g.strokeWeight(1);
              g.stroke(150, 255, 150);
              g.line(op.x, op.y, p.x, p.y);
              g.pop();
            }
          });

          points.forEach((p, i) => {
            if (points[i - 1]) {
              const op = points[i - 1];
              g.push();
              g.strokeWeight(2);
              if (p.y < op.y) {
                g.stroke(0, 255, 0);
              } else {
                g.stroke(255, 0, 0);
              }
              g.line(op.x, op.y, p.x, p.y);
              g.pop();
            }
            g.push();
            g.stroke(50);
            g.strokeWeight(4);
            g.point(p.x, p.y);
            g.pop();
          });

          if (points.length > 1) {
            const p = points[points.length - 1];
            g.push();
            g.strokeWeight(0.5);
            g.textAlign(g.CENTER, g.BOTTOM);
            g.text(p.v.toFixed(3), p.x, p.y);

            g.strokeWeight(1);

            g.stroke(130, 200, 130);
            g.line(margin, best.y, g.width - margin, best.y);
            g.stroke(0, 150, 0);
            g.text(best.v.toFixed(3), best.x, best.y);

            if (points.length > 2) {
              g.stroke(200, 130, 130);
              g.line(margin, worst.y, g.width - margin, worst.y);
              g.stroke(150, 0, 0);
              g.text(worst.v.toFixed(3), worst.x, worst.y);
            }

            g.pop();
          }
        };
      });
    }

    let font = gx.sketch.loadFont("font.ttf");
    const drawCache = gx.sketch.draw;
    gx.sketch.draw = function() {
      drawCache.apply(this);
      gx.sketch.push();

      gx.sketch.stroke(255, 0, 0);
      gx.sketch.strokeWeight(5);

      if (!gx.wrap_x) {
        gx.sketch.line(0, 0, 0, gx.sketch.height);
        gx.sketch.line(
          gx.sketch.width - 1,
          0,
          gx.sketch.width - 1,
          gx.sketch.height
        );
      }

      if (!gx.wrap_y) {
        gx.sketch.line(0, 0, gx.sketch.width, 0);
        gx.sketch.line(
          0,
          gx.sketch.height - 1,
          gx.sketch.width,
          gx.sketch.height - 1
        );
      }

      gx.sketch.strokeWeight(2);
      gx.sketch.stroke(0);
      gx.sketch.push();
      gx.sketch.textFont(font);
      gx.sketch.textSize(36);
      gx.sketch.fill(150);
      gx.sketch.text("Genetix", 10, gx.sketch.height - 10);
      gx.sketch.pop();
      gx.sketch.fill(255);
      gx.sketch.textAlign(gx.sketch.RIGHT);

      gx.sketch.text(
        `Generation #${gx.generationCount}`,
        gx.sketch.width - 10,
        gx.sketch.height - 55
      );
      gx.sketch.text(
        `Previous worst: ${gx.previousWorst}`,
        gx.sketch.width - 10,
        gx.sketch.height - 40
      );
      gx.sketch.text(
        `Previous best: ${gx.previousBest}`,
        gx.sketch.width - 10,
        gx.sketch.height - 25
      );
      gx.sketch.text(
        `Average fitness: ${gx.averageFitness}`,
        gx.sketch.width - 10,
        gx.sketch.height - 10
      );

      gx.sketch.text(
        `Population size: ${gx.population.size}`,
        gx.sketch.width - 10,
        20
      );
      gx.sketch.text(`Phenotype genes: ${gx.genes}`, gx.sketch.width - 10, 35);
      gx.sketch.text(
        `Mutation rate: ${gx.mutationRate * 100}%`,
        gx.sketch.width - 10,
        50
      );

      gx.sketch.pop();
    };

    gx.ag = () => gx.generationCount++;

    gx.targetArea = class Target {
      constructor(x, y, size) {
        this.position = gx.sketch.createVector(x, y);
        this.size = size;
        gx.target = this;
      }

      static define(options) {
        return new Target(options.x, options.y, options.size);
      }

      show(shape, size) {
        gx.sketch[shape](this.position.x, this.position.y, size || this.size);
      }
    };

    gx.phenotype = class Phenotype {
      constructor(dna, position) {
        this.dna = dna;
        this.current = 0;
        this.physics = {
          position,
          velocity: gx.sketch.createVector(),
          acceleration: null
        };
        this.start = position.copy();
        this.dead = false;
        this.fitness = null;
        this.wallHit = false;
      }

      static generate(size, position) {
        return new Phenotype(gx.dna.generate(size), position);
      }

      move() {
        if (!this.dead) {
          if (this.dna[this.current + 1]) {
            this.physics.acceleration = this.dna[this.current++].copy();
            this.physics.velocity.add(this.physics.acceleration);
            this.physics.velocity.limit(1);
            this.physics.position.add(this.physics.velocity);
            this.physics.acceleration.mult(0);
          } else {
            this.die();
          }
        }
      }

      evaluate() {
        const pos = this.physics.position;
        if (!this.dead) {
          if (pos.x < 0 || pos.x > gx.sketch.width) {
            if (gx.wrap_x) {
              if (pos.x < 0) pos.x = gx.sketch.width;
              else if (pos.x > gx.sketch.width) pos.x = 0;
            } else this.die(0);
          }

          if (pos.y < 0 || pos.y > gx.sketch.height) {
            if (gx.wrap_y) {
              if (pos.y < 0) pos.y = gx.sketch.height;
              else if (pos.y > gx.sketch.height) pos.y = 0;
            } else this.die(0);
          }

          let dist = pos.dist(gx.target.position);

          if (dist < gx.target.size / 2) {
            this.die();
            this.physics.position = gx.target.position;
            dist = 0;
          }

          const norm = gx.sketch.map(
            dist,
            0,
            Math.max(gx.sketch.width, gx.sketch.height),
            0.5,
            0
          );
          const step = gx.sketch.map(this.current, 0, this.dna.length, 0.5, 0);
          const total = norm + step;
          const final = this.wallHit ? 0 : total; //TODO: Perché total/2 invece di 0?

          this.fitness = gx.sketch.constrain(final, 0, 1);
        }
      }

      mate(other) {
        const dna = gx.dna.crossover(this.dna, other.dna);
        return new Phenotype(dna, this.start);
      }

      die(death) {
        if (!this.dead) {
          this.dead = true;
          if (death === 0) {
            this.wallHit = true;
          }
          gx.population.alive--;
        }
      }
    };

    gx.dna = class DNA {
      static generate(size) {
        const arr = [];
        for (let i = 0; i < size; i++) {
          arr.push(p5.Vector.fromAngle(gx.sketch.random(gx.sketch.TWO_PI)));
        }
        return arr;
      }

      static crossover(p1, p2) {
        const newDna = [];
        for (const g in p1) {
          const xAvg = (p1[g].x + p2[g].x) / 2;
          const yAvg = (p1[g].y + p2[g].y) / 2;

          const newVec =
            gx.sketch.random() < gx.mutationRate
              ? gx.dna.generate(1)[0]
              : gx.sketch.createVector(xAvg, yAvg);

          newDna.push(newVec);
        }
        return newDna;
      }
    };

    gx.populationData = class Population {
      constructor(v) {
        this.pool = v;
        this.size = v.length;
        this.alive = v.length;
        gx.population = this;
        gx.ag();

        if (gx.console) {
          console.log("Generation #", gx.generationCount);
        }
      }

      static from(arr) {
        return new Population(arr);
      }

      static generate(options) {
        options = options || {};

        const size = options.size || 100;
        const genes = options.genes || 10;
        const position = options.position || { x: 0, y: 0 };

        gx.genes = genes;

        const arr = [];
        for (let i = 0; i < size; i++) {
          const posData = gx.sketch.createVector(position.x, position.y);
          arr.push(gx.phenotype.generate(genes, posData));
        }

        if (gx.console) {
          console.log("Population config:");
          console.log("Size:", size);
          console.log("Genes:", genes);
          console.log("");
        }

        return Population.from(arr);
      }

      each(callback) {
        this.pool.forEach(item => callback(item));
      }

      show(shape, size) {
        this.each(p => {
          gx.sketch[shape](p.physics.position.x, p.physics.position.y, size);
        });
      }

      run() {
        this.move();
        this.evaluate();
        if (gx.population.alive <= 0) {
          this.renew();
        }
      }

      move() {
        this.each(p => {
          p.move();
        });
      }

      evaluate() {
        this.each(p => {
          p.evaluate();
        });
      }

      renew() {
        gx.averageFitness =
          gx.population.pool.reduce((acc, val) => acc + val.fitness, 0) /
          gx.population.size;
        gx.previousBest = gx.population.pool.sort(
          (a, b) => b.fitness - a.fitness
        )[0].fitness;
        gx.previousWorst = gx.population.pool.sort(
          (a, b) => a.fitness - b.fitness
        )[0].fitness;

        if (gx.console) {
          console.log(
            "Fitness >90%:",
            gx.population.pool.filter(p => p.fitness >= 0.9).length,
            "(" +
              (gx.population.pool.filter(p => p.fitness >= 0.9).length /
                gx.population.size) *
                100 +
              "%)"
          );
          console.log("Worst  :", gx.previousWorst);
          console.log("Best   :", gx.previousBest);
          console.log("Average:", gx.averageFitness);
          console.log("");
        }

        if (!gx.loop) {
          gx.sketch.noLoop();
          return;
        }

        const mPool = [];
        for (const p of this.pool) {
          const mapped = Math.floor(
            gx.sketch.map(p.fitness, gx.previousWorst, gx.previousBest, 0, 1) *
              100
          );
          for (let i = 0; i < mapped; i++) {
            mPool.push(p);
          }
        }

        const newPop = [];
        while (newPop.length < gx.population.size) {
          const p1 = gx.sketch.random(mPool);
          const p2 = gx.sketch.random(mPool);
          const cx = p1.mate(p2);
          newPop.push(cx);
        }

        mPool.splice(0);

        gx.population = gx.populationData.from(newPop);
      }
    };
  }

  gx.init = init;

  return gx;
});

new p5(function(w) {
  w.setup = function() {
    const params = K.params();

    w.createCanvas(1500, 500);

    gx.init({
      sketch: w,
      mutationRate: params.mutationRate || 0.01,
      wrap_y: false,
      graph: true
    });

    gx.targetArea.define({
      x: w.width - 250,
      y: w.height / 2,
      // x: w.width / 2,
      // y: 100,
      size: 100
    });

    gx.populationData.generate({
      size: params.populationSize || 500,
      genes: params.populationGenes || 1000,
      // position: {
      //   x: w.width / 2,
      //   y: w.height - 150
      // }
      position: {
        x: 200,
        y: w.height / 2
      }
    });
  };

  w.draw = function() {
    w.background(51);
    w.noStroke();

    w.fill(120, 250, 120);
    gx.target.show("ellipse");

    w.stroke(255, 100);
    w.strokeWeight(4);
    gx.population.show("point");

    gx.population.run();
  };
});

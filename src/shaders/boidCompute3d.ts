import {
  Fn,
  If,
  Loop,
  Return,
  float,
  instanceIndex,
  int,
  uint,
  uvec3,
  vec3,
} from "three/tsl";

const uvec3Node = (...args: any[]) => (uvec3 as any)(...args) as any;

export const createBoidCompute3d = ({
  alignmentFactor,
  boids,
  boidsSorted,
  cohesionFactor,
  getGridId,
  getGridLocation,
  gridOffsetsInclusive,
  gridDimXInt,
  gridDimYInt,
  gridDimZInt,
  maxSpeed,
  minDistanceSq,
  minSpeed,
  numBoids,
  numBoidsUint,
  oneUint,
  params,
  separationFactor,
  turnSpeed,
  visualRangeSq,
  workgroupSize,
  xBound,
  yBound,
  zBound,
  zeroUint,
}: Record<string, any>) => {
  const randSeed = uint(Math.floor(Math.random() * 4294967296));
  const rngState = uint(0).toVar();

  const randPCG = Fn(([min, max]: [any, any]) => {
    rngState.assign(rngState.mul(747796405).add(2891336453));
    const state = rngState.toVar();
    const word = state
      .shiftRight(state.shiftRight(28).add(uint(4)))
      .bitXor(state)
      .mul(uint(277803737));
    const randomValue = word
      .shiftRight(22)
      .bitXor(word)
      .toFloat()
      .div(float(4294967296));

    return randomValue.mul(max.sub(min)).add(min);
  });

  const generateBoids = Fn(() => {
    If(instanceIndex.greaterThanEqual(numBoidsUint), () => {
      Return();
    });

    const boid: any = boids.element(instanceIndex);
    rngState.assign(randSeed.add(instanceIndex));

    boid.get("pos").assign(
      vec3(
        randPCG(xBound.negate(), xBound),
        randPCG(yBound.negate(), yBound),
        randPCG(zBound.negate(), zBound),
      ),
    );
    boid.get("vel").assign(
      vec3(
        randPCG(float(-1), float(1)),
        randPCG(float(-1), float(1)),
        randPCG(float(-1), float(1)),
      ),
    );
  })().compute(numBoids, [workgroupSize]);

  const updateBoids = Fn(() => {
    If(instanceIndex.greaterThanEqual(numBoidsUint), () => {
      Return();
    });

    const boidIn: any = boidsSorted.element(instanceIndex);
    const boidPos: any = boidIn.get("pos").toVar("boidPos");
    const boidVel: any = boidIn.get("vel").toVar("boidVel");
    const center: any = (float(0) as any).toVec3().toVar("center");
    const close: any = (float(0) as any).toVec3().toVar("close");
    const avgVel: any = (float(0) as any).toVec3().toVar("avgVel");
    const neighbours: any = zeroUint.toVar("neighbours");
    const gridCell = getGridLocation(boidPos).toVar("gridCell");

    Loop(
      { condition: "<=", end: int(1), start: int(-1), type: "int" },
      ({ i: zOffset }: { i: any }) => {
        const z = int(gridCell.z).add(zOffset).toVar("z");

        Loop(
          { condition: "<=", end: int(1), start: int(-1), type: "int" },
          ({ i: yOffset }: { i: any }) => {
            const y = int(gridCell.y).add(yOffset).toVar("y");

            If(
              z
                .greaterThanEqual(int(0))
                .and(z.lessThan(gridDimZInt))
                .and(y.greaterThanEqual(int(0)).and(y.lessThan(gridDimYInt))),
              () => {
                Loop(
                  {
                    condition: "<=",
                    end: int(1),
                    start: int(-1),
                    type: "int",
                  },
                  ({ i: xOffset }: { i: any }) => {
                    const x = int(gridCell.x).add(xOffset).toVar("x");

                    If(
                      x.greaterThanEqual(int(0)).and(x.lessThan(gridDimXInt)),
                      () => {
                        const neighbourCell = uvec3Node(
                          x.toUint(),
                          y.toUint(),
                          z.toUint(),
                        ).toVar("neighbourCell");
                        const cellId = getGridId(neighbourCell).toVar("cellId");
                        const bucketStart = zeroUint.toVar("bucketStart");
                        const bucketEnd = gridOffsetsInclusive
                          .element(cellId)
                          .toVar("bucketEnd");

                        If(cellId.greaterThan(zeroUint), () => {
                          bucketStart.assign(
                            gridOffsetsInclusive.element(cellId.sub(oneUint)),
                          );
                        });

                        Loop(
                          {
                            condition: "<",
                            end: bucketEnd,
                            start: bucketStart,
                            type: "uint",
                          },
                          ({ i }: { i: any }) => {
                            const other = boidsSorted.element(i);
                            const diff = boidPos
                              .sub(other.get("pos"))
                              .toVar("diff");
                            const distSq = diff.dot(diff).toVar("distSq");

                            If(
                              distSq
                                .lessThan(visualRangeSq)
                                .and(distSq.greaterThan(float(0))),
                              () => {
                                If(distSq.lessThan(minDistanceSq), () => {
                                  close.addAssign(
                                    diff.mul(float(1).div(distSq)),
                                  );
                                });

                                center.addAssign(other.get("pos"));
                                avgVel.addAssign(other.get("vel"));
                                neighbours.addAssign(oneUint);
                              },
                            );
                          },
                        );
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );

    If(neighbours.greaterThan(zeroUint), () => {
      const neighbourCount = float(neighbours);

      center.divAssign(neighbourCount);
      avgVel.divAssign(neighbourCount);
      boidVel.addAssign(center.sub(boidPos).mul(cohesionFactor).mul(params.dt));
      boidVel.addAssign(
        avgVel.sub(boidVel).mul(alignmentFactor).mul(params.dt),
      );
    });

    boidVel.addAssign(close.mul(separationFactor).mul(params.dt));

    const speed = boidVel.length().toVar("speed");
    If(speed.greaterThan(float(0)), () => {
      const clampedSpeed = speed
        .clamp(minSpeed, maxSpeed)
        .toVar("clampedSpeed");
      boidVel.mulAssign(clampedSpeed.div(speed));
    });

    If(boidPos.x.abs().greaterThan(xBound), () => {
      boidVel.x.subAssign(boidPos.x.sign().mul(turnSpeed).mul(params.dt));
    });

    If(boidPos.y.abs().greaterThan(yBound), () => {
      boidVel.y.subAssign(boidPos.y.sign().mul(turnSpeed).mul(params.dt));
    });

    If(boidPos.z.abs().greaterThan(zBound), () => {
      boidVel.z.subAssign(boidPos.z.sign().mul(turnSpeed).mul(params.dt));
    });

    boidPos.addAssign(boidVel.mul(params.dt));

    const boidOut: any = boids.element(instanceIndex);
    boidOut.get("pos").assign(boidPos);
    boidOut.get("vel").assign(boidVel);
  })().compute(numBoids, [workgroupSize]);

  return {
    generateBoids,
    updateBoids,
  };
};

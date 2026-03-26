import {
  Fn,
  If,
  Return,
  atomicAdd,
  instanceIndex,
  uint,
  uvec2,
  workgroupBarrier,
} from "three/tsl";

const uvec2Node = (...args: any[]) => (uvec2 as any)(...args) as any;

export const createGridShader2d = ({
  boids,
  boidsSorted,
  bounds,
  grid,
  gridOffsets,
  gridOffsetsAtomic,
  gridOffsetsInclusive,
  gridSums,
  gridSumsScratch,
  numBoids,
  numBoidsUint,
  oneUint,
  params,
  prefixTemp,
  cellSize,
  gridDimXFloat,
  gridDimXUint,
  gridDimYFloat,
  blocksUint,
  gridTotalCellsUint,
  half,
  lastLocalIndex,
  workgroupSize,
  workgroupSizeUint,
  zeroUint,
}: Record<string, any>) => {
  const getGridLocation = Fn(([position]: [any]) => {
    return uvec2Node(
      position.x.div(cellSize).add(gridDimXFloat.mul(half)).floor().toUint(),
      position.y.div(cellSize).add(gridDimYFloat.mul(half)).floor().toUint(),
    );
  }).setLayout({
    inputs: [{ name: "position", type: "vec2" }],
    name: "getGridLocation2d",
    type: "uvec2",
  });

  const getGridId = Fn(([cell]: [any]) => {
    return gridDimXUint.mul(cell.y).add(cell.x);
  }).setLayout({
    inputs: [{ name: "cell", type: "uvec2" }],
    name: "getGridId2d",
    type: "uint",
  });

  const clearGrid = Fn(() => {
    If(instanceIndex.greaterThanEqual(gridTotalCellsUint), () => {
      Return();
    });

    gridOffsets.element(instanceIndex).assign(zeroUint);
  })().compute(bounds.gridTotalCells, [workgroupSize]);

  const updateGrid = Fn(() => {
    If(instanceIndex.greaterThanEqual(numBoidsUint), () => {
      Return();
    });

    const boid: any = boids.element(instanceIndex);
    const gridId = getGridId(getGridLocation(boid.get("pos"))).toVar("gridId");
    const gridCell = grid.element(instanceIndex);

    gridCell.x.assign(gridId);
    gridCell.y.assign(atomicAdd(gridOffsetsAtomic.element(gridId), oneUint));
  })().compute(numBoids, [workgroupSize]);

  const prefixSumGrid = Fn(() => {
    const groupIndex = instanceIndex.div(workgroupSizeUint).toVar("groupIndex");
    const localIndex = instanceIndex.mod(workgroupSizeUint).toVar("localIndex");

    If(instanceIndex.lessThan(gridTotalCellsUint), () => {
      prefixTemp.element(localIndex).assign(gridOffsets.element(instanceIndex));
    }).Else(() => {
      prefixTemp.element(localIndex).assign(zeroUint);
    });

    workgroupBarrier();

    let readBase: any = zeroUint;
    let writeBase: any = workgroupSizeUint;

    for (let offset = 1; offset < workgroupSize; offset *= 2) {
      const offsetUint: any = uint(offset);
      const currentReadBase = readBase;
      const currentWriteBase = writeBase;

      If(localIndex.greaterThanEqual(offsetUint), () => {
        prefixTemp
          .element(currentWriteBase.add(localIndex))
          .assign(
            prefixTemp
              .element(currentReadBase.add(localIndex))
              .add(
                prefixTemp.element(
                  currentReadBase.add(localIndex.sub(offsetUint)),
                ),
              ),
          );
      }).Else(() => {
        prefixTemp
          .element(currentWriteBase.add(localIndex))
          .assign(prefixTemp.element(currentReadBase.add(localIndex)));
      });

      workgroupBarrier();

      const nextReadBase = writeBase;
      writeBase = readBase;
      readBase = nextReadBase;
    }

    If(instanceIndex.greaterThanEqual(gridTotalCellsUint), () => {
      Return();
    });

    gridOffsetsInclusive
      .element(instanceIndex)
      .assign(prefixTemp.element(readBase.add(localIndex)));

    If(localIndex.equal(zeroUint), () => {
      gridSums
        .element(groupIndex)
        .assign(prefixTemp.element(readBase.add(lastLocalIndex)));
    });
  })().compute(bounds.gridTotalCells, [workgroupSize]);

  const createBlockSumsPass = (scanIn: any, scanOut: any) =>
    Fn(() => {
      If(instanceIndex.greaterThanEqual(blocksUint), () => {
        Return();
      });

      If(instanceIndex.lessThan(params.divider), () => {
        scanOut.element(instanceIndex).assign(scanIn.element(instanceIndex));
      }).Else(() => {
        scanOut
          .element(instanceIndex)
          .assign(
            scanIn
              .element(instanceIndex)
              .add(scanIn.element(instanceIndex.sub(params.divider))),
          );
      });
    })().compute(bounds.blocks, [workgroupSize]);

  const scanBlockSumsForward = createBlockSumsPass(gridSums, gridSumsScratch);
  const scanBlockSumsBackward = createBlockSumsPass(gridSumsScratch, gridSums);

  const finalizeGridSums = Fn(() => {
    If(instanceIndex.greaterThanEqual(blocksUint), () => {
      Return();
    });

    gridSums
      .element(instanceIndex)
      .assign(gridSumsScratch.element(instanceIndex));
  })().compute(bounds.blocks, [workgroupSize]);

  const addBlockSums = Fn(() => {
    const groupIndex = instanceIndex.div(workgroupSizeUint).toVar("groupIndex");

    If(
      groupIndex
        .equal(zeroUint)
        .or(instanceIndex.greaterThanEqual(gridTotalCellsUint)),
      () => {
        Return();
      },
    );

    gridOffsetsInclusive
      .element(instanceIndex)
      .assign(
        gridOffsetsInclusive
          .element(instanceIndex)
          .add(gridSums.element(groupIndex.sub(oneUint))),
      );
  })().compute(bounds.gridTotalCells, [workgroupSize]);

  const rearrangeBoids = Fn(() => {
    If(instanceIndex.greaterThanEqual(numBoidsUint), () => {
      Return();
    });

    const gridCell = grid.element(instanceIndex);
    const newIndex = gridOffsetsInclusive
      .element(gridCell.x)
      .sub(oneUint)
      .sub(gridCell.y)
      .toVar("newIndex");
    const boidIn = boids.element(instanceIndex);
    const boidOut = boidsSorted.element(newIndex);

    boidOut.get("pos").assign(boidIn.get("pos"));
    boidOut.get("vel").assign(boidIn.get("vel"));
  })().compute(numBoids, [workgroupSize]);

  return {
    addBlockSums,
    clearGrid,
    finalizeGridSums,
    getGridId,
    getGridLocation,
    prefixSumGrid,
    rearrangeBoids,
    scanBlockSumsBackward,
    scanBlockSumsForward,
    updateGrid,
  };
};

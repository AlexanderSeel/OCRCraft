import type { DuckDBConnection } from "@duckdb/node-api";

export type ExerciseFacetBodyRegionInput = {
  readonly id: string;
  readonly emphasis: "primary" | "secondary";
};

export type ExerciseFacetEquipmentInput = {
  readonly id: string;
  readonly quantityRequired: number;
};

export type ExerciseMuscleOppositionInput = {
  readonly primaryRegionId: string;
  readonly opposingRegionId: string;
};

export interface ExerciseFacetMutationInput {
  readonly bodyRegions: readonly ExerciseFacetBodyRegionInput[];
  readonly movementPatternIds: readonly string[];
  readonly tagIds: readonly string[];
  readonly equipment: readonly ExerciseFacetEquipmentInput[];
  readonly muscleOppositions?: readonly ExerciseMuscleOppositionInput[];
}

export async function replaceExerciseFacetMappings(
  connection: DuckDBConnection,
  exerciseId: string,
  input: ExerciseFacetMutationInput,
): Promise<void> {
  await connection.run(
    "DELETE FROM exercise_muscle_oppositions WHERE exercise_id=$exerciseId::UUID",
    { exerciseId },
  );
  await connection.run(
    "DELETE FROM exercise_body_regions WHERE exercise_id=$exerciseId::UUID",
    { exerciseId },
  );
  await connection.run(
    "DELETE FROM exercise_movement_patterns WHERE exercise_id=$exerciseId::UUID",
    { exerciseId },
  );
  await connection.run(
    "DELETE FROM exercise_tags WHERE exercise_id=$exerciseId::UUID",
    { exerciseId },
  );
  await connection.run(
    "DELETE FROM exercise_equipment WHERE exercise_id=$exerciseId::UUID",
    { exerciseId },
  );

  for (const bodyRegion of input.bodyRegions) {
    await connection.run(
      "INSERT INTO exercise_body_regions (exercise_id,body_region_id,emphasis) VALUES ($exerciseId::UUID,$id,$emphasis)",
      { exerciseId, id: bodyRegion.id, emphasis: bodyRegion.emphasis },
    );
  }

  for (const opposition of input.muscleOppositions ?? []) {
    if (opposition.primaryRegionId === opposition.opposingRegionId) continue;
    await connection.run(
      `INSERT OR IGNORE INTO exercise_muscle_oppositions
        (exercise_id,primary_region_id,opposing_region_id,relationship)
       VALUES ($exerciseId::UUID,$primaryRegionId,$opposingRegionId,'antagonist')`,
      {
        exerciseId,
        primaryRegionId: opposition.primaryRegionId,
        opposingRegionId: opposition.opposingRegionId,
      },
    );
  }

  for (const id of input.movementPatternIds) {
    await connection.run(
      "INSERT INTO exercise_movement_patterns (exercise_id,movement_pattern_id) VALUES ($exerciseId::UUID,$id)",
      { exerciseId, id },
    );
  }

  for (const id of input.tagIds) {
    await connection.run(
      "INSERT INTO exercise_tags (exercise_id,tag_id) VALUES ($exerciseId::UUID,$id)",
      { exerciseId, id },
    );
  }

  for (const item of input.equipment) {
    await connection.run(
      "INSERT INTO exercise_equipment (exercise_id,equipment_id,quantity_required) VALUES ($exerciseId::UUID,$id::UUID,$quantity)",
      { exerciseId, id: item.id, quantity: item.quantityRequired },
    );
  }
}

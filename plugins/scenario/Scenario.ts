import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ForkSpec } from './Runner';

export class World {
  hre: HardhatRuntimeEnvironment;

  constructor(hre) {
    this.hre = hre;
  }

  async _snapshot() {
    // XXX
    // console.log('xxx snapshot')
  }

  async _revert() {
    // XXX
    // console.log('xxx revert')
  }
}

// A solution modifies a given context and world in a way that satisfies a constraint.
export type Solution<T> = (T, World) => Promise<T>;

// A constraint is capable of producing solutions for a context and world *like* the ones provided.
// A constraint can also check a given context and world to see if they *actually* satisfy it.
// Note: `solve` and `check` are expected to treat the context and world as immutable.
export interface Constraint<T> {
  solve(requirements: object, context: T, world: World): Promise<Solution<T>[]>;
  check(requirements: object, context: T, world: World): Promise<void>;
}

export type Property<T> = (context: T, world: World) => Promise<any>;
export type Initializer<T> = (world: World, base: ForkSpec) => Promise<T>;
export type Forker<T> = (T) => Promise<T>;

export type ScenarioFlags = null | "only" | "skip";

export class Scenario<T> {
  name: string;
  requirements: object;
  property: Property<T>;
  initializer: Initializer<T>;
  forker: Forker<T>;
  constraints: Constraint<T>[];
  flags: ScenarioFlags;

  constructor(name, requirements, property, initializer, forker, constraints, flags) {
    this.name = name;
    this.requirements = requirements;
    this.property = property;
    this.initializer = initializer;
    this.forker = forker;
    this.constraints = constraints;
    this.flags = flags;
  }
}
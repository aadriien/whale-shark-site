import * as THREE from "three";

import { SharkSteeringProps, SharkSteeringState } from "../types/animations";

// Whale sharks are slow, wide turners. Speeds are in body lengths per second,
// turn rates in radians per second
const SPEED = { wander: 0.25, seek: 0.6, linger: 0.08 };
const TURN_RATE = { wander: 0.5, seek: 1.0 };

// Tail beat quickens with speed (max matches home page ripple speed of 4)
const RIPPLE_RATE = { min: 1.5, max: 4 };
const RIPPLE_AMPLITUDE = { min: 12, max: 20 };

const LINGER_SECONDS = { min: 3, max: 5 };
const ARRIVE_RADIUS = 0.75; // body lengths
const SPEED_DAMPING = 1.5;
const BOUNDS_INSET = 0.15; // fraction of bounds size kept clear of edges on wander

export function createSharkSteering({ shark, bounds, sharkLength }: SharkSteeringProps) {
    const insetBy = bounds.getSize(new THREE.Vector3()).multiplyScalar(-BOUNDS_INSET);
    const wanderBounds = bounds.clone().expandByVector(insetBy);

    const forward = new THREE.Vector3(1, 0, 0);
    const target = new THREE.Vector3();
    const desired = new THREE.Vector3();
    const turnAxis = new THREE.Vector3();
    const lookAtPoint = new THREE.Vector3();

    let state: SharkSteeringState = "wander";
    let speed = sharkLength * SPEED.wander;
    let lingerRemaining = 0;
    let ripplePhase = 0;
    let speedRatio = 0;

    const pickWanderTarget = () => {
        target.set(
            THREE.MathUtils.randFloat(wanderBounds.min.x, wanderBounds.max.x),
            THREE.MathUtils.randFloat(wanderBounds.min.y, wanderBounds.max.y),
            THREE.MathUtils.randFloat(wanderBounds.min.z, wanderBounds.max.z)
        );
    };

    shark.position.copy(wanderBounds.getCenter(new THREE.Vector3()));
    pickWanderTarget();

    const turnToward = (maxAngle: number) => {
        desired.copy(target).sub(shark.position).normalize();

        turnAxis.crossVectors(forward, desired);
        if (turnAxis.lengthSq() < 1e-8) turnAxis.set(0, 1, 0);

        const angle = Math.min(forward.angleTo(desired), maxAngle);
        forward.applyAxisAngle(turnAxis.normalize(), angle).normalize();
    };

    const update = (delta: number) => {
        if (state === "linger") {
            lingerRemaining -= delta;
            if (lingerRemaining <= 0) {
                state = "wander";
                pickWanderTarget();
            }
        } else if (shark.position.distanceTo(target) < sharkLength * ARRIVE_RADIUS) {
            if (state === "seek") {
                state = "linger";
                lingerRemaining = THREE.MathUtils.randFloat(LINGER_SECONDS.min, LINGER_SECONDS.max);
            } else {
                pickWanderTarget();
            }
        }

        const targetSpeed = sharkLength * SPEED[state];
        speed += (targetSpeed - speed) * Math.min(1, SPEED_DAMPING * delta);

        if (state !== "linger") turnToward(TURN_RATE[state] * delta);
        shark.position.addScaledVector(forward, speed * delta);

        // Nose alignment when approaching target
        lookAtPoint.copy(shark.position).add(forward);
        shark.up.set(0, 1, 0);
        shark.lookAt(lookAtPoint);
        shark.rotateX(-Math.PI / 2);
        shark.rotateZ(Math.PI);

        speedRatio = THREE.MathUtils.clamp(speed / (sharkLength * SPEED.seek), 0, 1);
        ripplePhase += delta * THREE.MathUtils.lerp(RIPPLE_RATE.min, RIPPLE_RATE.max, speedRatio);
    };

    const setTarget = (point: THREE.Vector3) => {
        target.copy(point);
        state = "seek";
    };

    const getState = () => state;

    const getRipple = () => ({
        phase: ripplePhase,
        amplitude: THREE.MathUtils.lerp(RIPPLE_AMPLITUDE.min, RIPPLE_AMPLITUDE.max, speedRatio),
    });

    return { update, setTarget, getState, getRipple };
}

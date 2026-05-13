export const sampleDSL = {
  "dsl": {
    "meta": {
      "id": "adjustable_pendulum_v1",
      "title": "Variable Length Pendulum",
      "topic": "Simple Harmonic Motion",
      "difficulty": "Grade 10",
      "version": "1.0"
    },
    "environment": {
      "gravity": {
        "x": 0.0,
        "y": 1.0
      },
      "airResistance": 0.002,
      "world": {
        "width": 800.0,
        "height": 600.0
      },
      "background": {
        "color": "#0f172a"
      }
    },
    "objects": [
      {
        "id": "pivot_point",
        "type": "staticBody",
        "shape": {
          "type": "circle",
          "radius": 0.2
        },
        "position": {
          "x": 10.0,
          "y": 2.0
        },
        "velocity": {
          "x": 0.0,
          "y": 0.0
        },
        "rotation": 0.0,
        "physics": {
          "mass": 0.0,
          "isSensor": false
        },
        "material": {
          "friction": 0.0,
          "restitution": 0.0
        },
        "visual": {
          "color": "#94a3b8",
          "label": "Retort Stand",
          "showVelocityVector": false
        }
      },
      {
        "id": "pendulum_bob",
        "type": "dynamicBody",
        "shape": {
          "type": "circle",
          "radius": 0.6
        },
        "position": {
          "x": 14.0,
          "y": 6.0
        },
        "velocity": {
          "x": 0.0,
          "y": 0.0
        },
        "rotation": 0.0,
        "physics": {
          "mass": 2.0,
          "isSensor": false
        },
        "material": {
          "friction": 0.01,
          "restitution": 0.5
        },
        "visual": {
          "color": "#ef4444",
          "label": "Bob",
          "showVelocityVector": true
        }
      }
    ],
    "forces": [],
    "constraints": [
      {
        "id": "string_constraint",
        "type": "rope",
        "bodyA": "pivot_point",
        "bodyB": "pendulum_bob",
        "length": 5.0,
        "stiffness": 1.0
      }
    ],
    "behaviors": [
      {
        "id": "damping",
        "type": "drag",
        "targets": [
          "pendulum_bob"
        ],
        "coefficient": 0.005,
        "enabled": true
      }
    ],
    "interactions": [
      {
        "id": "length_slider",
        "type": "slider",
        "label": "Rope Length (m)",
        "bind": "constraints[0].length",
        "min": 2.0,
        "max": 8.0,
        "step": 0.5
      },
      {
        "id": "gravity_toggle",
        "type": "toggle",
        "label": "Zero Gravity",
        "bind": "environment.gravity.y"
      }
    ],
    "runtime": {
      "engine": "matter-js",
      "fps": 60,
      "scale": 50
    }
  },
  "knowledge": {
    "relevant_formulas": [
      "T = 2\u03c0\u221a(L/g)",
      "f = 1/T"
    ]
  }
};
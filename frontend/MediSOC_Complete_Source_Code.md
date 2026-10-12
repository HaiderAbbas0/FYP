# MediSOC — Complete Healthcare Cybersecurity Web Platform
## All-In-One Master Source Code Document

> **Project**: MediSOC — Healthcare Cybersecurity Operations & IoMT Incident Response Platform
> **Contents**: Complete source code for all public marketing pages, all authenticated SOC platform screens (Super Admin & Analyst), state managers, mock data, and components with zero skipped lines.

## 📑 Table of Contents

1. `.figma/make/dev.json`
2. `.figma/make/site.json`
3. `index.html`
4. `package-lock.json`
5. `package.json`
6. `src/App.tsx`
7. `src/api/apiService.ts`
8. `src/auth/AuthContext.tsx`
9. `src/components/ConfirmDialog.tsx`
10. `src/components/Header.tsx`
11. `src/components/Logo.tsx`
12. `src/components/MockBanner.tsx`
13. `src/components/Sidebar.tsx`
14. `src/components/TopBar.tsx`
15. `src/components/TopNav.tsx`
16. `src/components/ui/Badge.tsx`
17. `src/components/ui/Button.tsx`
18. `src/components/ui/Card.tsx`
19. `src/data/mock.ts`
20. `src/index.css`
21. `src/main.tsx`
22. `src/marketing/About.tsx`
23. `src/marketing/Contact.tsx`
24. `src/marketing/GenericPage.tsx`
25. `src/marketing/Home.tsx`
26. `src/marketing/Integrations.tsx`
27. `src/marketing/MarketingLayout.tsx`
28. `src/marketing/Platform.tsx`
29. `src/marketing/Resources.tsx`
30. `src/marketing/SecurityCompliance.tsx`
31. `src/marketing/Solutions.tsx`
32. `src/marketing/components/MarketingFooter.tsx`
33. `src/marketing/components/MarketingNavbar.tsx`
34. `src/screens/AcceptInvitation.tsx`
35. `src/screens/AttackSimulation.tsx`
36. `src/screens/AuditLog.tsx`
37. `src/screens/CaseDetail.tsx`
38. `src/screens/CaseMemory.tsx`
39. `src/screens/Dashboard.tsx`
40. `src/screens/DeviceDetail.tsx`
41. `src/screens/Devices.tsx`
42. `src/screens/Evaluation.tsx`
43. `src/screens/ForgotPassword.tsx`
44. `src/screens/IncidentDetail.tsx`
45. `src/screens/Incidents.tsx`
46. `src/screens/Login.tsx`
47. `src/screens/Reports.tsx`
48. `src/screens/ResetPassword.tsx`
49. `src/screens/SystemHealth.tsx`
50. `src/screens/VerifyEmail.tsx`
51. `src/types.ts`
52. `src/vite-env.d.ts`
53. `tsconfig.json`
54. `vite.config.ts`

================================================================================


################################################################################
### FILE 1/54: `.figma/make/dev.json`
################################################################################

```json
{
  // Files whose changes trigger the install script + dev server restart.
  // Glob syntax: doublestar (supports **, *, ?, [abc], {a,b}). Paths are
  // repo-relative and case-sensitive. `.mise.toml` and the scripts under
  // `.figma/make/` are always watched regardless of these lists.
  //
  // Each key accepts a shorthand array of globs:
  //   "installOn": ["package.json"]
  // or an object with includes/excludes:
  //   "installOn": { "includes": ["**/*.json"], "excludes": ["test/**"] }
  //
  // Only list files that affect the *toolchain or dependency tree* here —
  // NOT application source files. Vite's dev server already watches
  // application code (src/**/*) and config (vite.config.ts) via its own HMR
  // pipeline, so including them here would cause a redundant full restart.
  "installOn": [
    "package.json",
    "pnpm-lock.yaml"
  ],
  // Files whose changes trigger only a dev server restart (no install).
  "restartOn": []
}
```


################################################################################
### FILE 2/54: `.figma/make/site.json`
################################################################################

```json
{
  "description": "Simulates and monitors DoS/DDoS attacks on isolated IoMT networks, enabling a Super Admin to analyze defense responses and validate containment success.",
  "robots": {
    "index": false
  },
  "accessibility": {
    "addBypassLinks": false,
    "ignoreReducedMotion": false
  }
}
```


################################################################################
### FILE 3/54: `index.html`
################################################################################

```html
<!doctype html>
<html lang="<!-- figma:lang -->">
  <head>
    <!-- figma:head-start -->
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MediSOC | Healthcare Cybersecurity Operations Platform</title>
    <link rel="icon" type="image/png" href="/medisoc-logo.png" />
    <meta name="description" content="Enterprise healthcare cybersecurity operations for connected medical devices (IoMT) and hospital networks." />
    <!-- figma:head-end -->
  </head>
  <body>
    <!-- figma:body-start -->
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <!-- figma:body-end -->
  </body>
</html>
```


################################################################################
### FILE 4/54: `package-lock.json`
################################################################################

```json
{
  "name": "figma-make-app",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "figma-make-app",
      "version": "1.0.0",
      "dependencies": {
        "pngjs": "^7.0.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0",
        "react-router-dom": "^7.18.4",
        "recharts": "^3.10.1"
      },
      "devDependencies": {
        "@tailwindcss/vite": "^4.0.0",
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@vitejs/plugin-react": "^6.0.0",
        "oxfmt": "^0.2.0",
        "tailwindcss": "^4.0.0",
        "typescript": "^5.7.0",
        "vite": "^8.0.5"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/remapping": {
      "version": "2.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.6.0.tgz",
      "integrity": "sha512-T7jf+5zgsZHwNJ4lvQ7/aezbyk0nNX+zJVWpmHA7VYsEx7a7qr5Rg5IbtJFqkgze5Y2sruq1RUY8Q837Od7iFw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@oxc-project/types": {
      "version": "0.153.0",
      "resolved": "https://registry.npmjs.org/@oxc-project/types/-/types-0.153.0.tgz",
      "integrity": "sha512-jSNrRIyvPVLL5E1z/tS5zLAprosGz/FuI1PWwEOz59j3E4TTTzSpqKb/RDGqJhhW0QHYISGXxq582wGx6T11Tw==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/oxc-project"
      }
    },
    "node_modules/@oxfmt/darwin-arm64": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@oxfmt/darwin-arm64/-/darwin-arm64-0.2.0.tgz",
      "integrity": "sha512-NK7iEPqRovUvKac+4dn2ui8v5Y5q6UJ9v4z5Zjr5lmEzTlBwXToP3TwY75IAaCYeu0g8Es7ToJpS7qCQuxUhuA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@oxfmt/darwin-x64": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@oxfmt/darwin-x64/-/darwin-x64-0.2.0.tgz",
      "integrity": "sha512-eXDgT+DbIMnA3sWE+w38rOvXaxkP4RvHi41rPpWb9XoRGbM+tOo0c8RYqCIX39n7PizOlbF/xUBh9nMhiW01wQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@oxfmt/linux-arm64-gnu": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@oxfmt/linux-arm64-gnu/-/linux-arm64-gnu-0.2.0.tgz",
      "integrity": "sha512-h4mw9/Lck5X/SU1RPE26VraoBJgn9SOoLl8GnaYvtmRBFHK0v+2KpnBSwMWeiaIxCdJSsrVc9mpKSOcPsen7Cg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@oxfmt/linux-arm64-musl": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@oxfmt/linux-arm64-musl/-/linux-arm64-musl-0.2.0.tgz",
      "integrity": "sha512-kDZ/kVCgh9kSczMH2gPXZs+rsY/VcCQ1BoQnND8D3v1Le91LceJ5s/a4XBBA3ADI3NiPdqNmK2ssaxY4BfgXDg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@oxfmt/linux-x64-gnu": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@oxfmt/linux-x64-gnu/-/linux-x64-gnu-0.2.0.tgz",
      "integrity": "sha512-qvf6cNuf4z3yjzjSvg4Jwr88jDyeFaYPU+4dBWVr6fdWhAA+BIuIvurJWYQGvWNNSkobVWH3A7m+wp+h5fNsSg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@oxfmt/linux-x64-musl": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@oxfmt/linux-x64-musl/-/linux-x64-musl-0.2.0.tgz",
      "integrity": "sha512-D0rw4BVLHEbtMB6p9e+Ph7Y/56oD1DRP4Qcbbv1B1w0kJanWBB3vMH+v2rqgeYsErqJOtLpYRkPFmJSU9In2HA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@oxfmt/win32-arm64": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@oxfmt/win32-arm64/-/win32-arm64-0.2.0.tgz",
      "integrity": "sha512-QM0fP8YUvBNyuNa6d+jNonV34A6zGvvQ2mX93wnERpX25jIbFKljKiKDiWo2M1nUsW8zL2z4ESEeaLO9bx8djg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@oxfmt/win32-x64": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@oxfmt/win32-x64/-/win32-x64-0.2.0.tgz",
      "integrity": "sha512-WkFXliDbwFiziBSfvWXeM0Y3x07Kxxrl39kgsp+N3n5QgzsM8q6qe094+OW+hItDQ+9SSd2y9u231sMCsKxlog==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@reduxjs/toolkit": {
      "version": "2.13.0",
      "resolved": "https://registry.npmjs.org/@reduxjs/toolkit/-/toolkit-2.13.0.tgz",
      "integrity": "sha512-f6jwVRfwW30+tnllz4YcsHHpPYYOE7abcHkyUCovD+P7DyhdAI5prz2Fh/8TLhakjpN+7aIEion1s5L/tvlYlA==",
      "license": "MIT",
      "dependencies": {
        "@standard-schema/spec": "^1.0.0",
        "@standard-schema/utils": "^0.3.0",
        "immer": "^11.0.0",
        "redux": "^5.0.1",
        "redux-thunk": "^3.1.0",
        "reselect": "^5.1.0"
      },
      "peerDependencies": {
        "react": "^16.9.0 || ^17.0.0 || ^18 || ^19",
        "react-redux": "^7.2.1 || ^8.1.3 || ^9.0.0"
      },
      "peerDependenciesMeta": {
        "react": {
          "optional": true
        },
        "react-redux": {
          "optional": true
        }
      }
    },
    "node_modules/@rolldown/binding-android-arm-eabi": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-android-arm-eabi/-/binding-android-arm-eabi-1.2.13.tgz",
      "integrity": "sha512-Vu/NICrgdRvUOeaJZIyB2FP63s6fO/4ud5l8dXmxDx9yDyn+mN0y+gsvsVviSli+T361Aqo0h46EuMoobrwawA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-android-arm64": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-android-arm64/-/binding-android-arm64-1.2.13.tgz",
      "integrity": "sha512-6LEoIrGy5vvCd2boNnv2soPSUZj/PRvhp8R/t9KlX+mIZxThIE/ZqxrGXxmuNX0FuvQFvLdZr7S4HrYpYBVhEQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-darwin-arm64": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-arm64/-/binding-darwin-arm64-1.2.13.tgz",
      "integrity": "sha512-CaJSRzlQ6Q+zkDMVA9OkVxBjVoPRCDEE3v0FSJ9kIQBgRjFApA3Si4ijhbNVUji7ZJt+PfO0e46qy4nPInHUPA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-darwin-x64": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-darwin-x64/-/binding-darwin-x64-1.2.13.tgz",
      "integrity": "sha512-e4r340I5hxSzJkD3YJBxgzq/rJ3wwxwdLLb2FPt1Zpyem20nrQPT11DDEEkazwxaHumH8wpglsp/Ozgj/wT6mw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-freebsd-x64": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-freebsd-x64/-/binding-freebsd-x64-1.2.13.tgz",
      "integrity": "sha512-hoBWDZ4/K/mJKVMbsgUd1jfpA2DiOrJ54mpegObU9TBHBBrtX4FLIXJJQRDPZ/2Dn91GvPob+Z2hwKJzf4E5SQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm-gnueabihf": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm-gnueabihf/-/binding-linux-arm-gnueabihf-1.2.13.tgz",
      "integrity": "sha512-oF9fZu3vTWnTiVAkDFxU9PJLt1nh20K9RRpuHsR7ZnE2L7XookBbDBVLojCVSLGbvtSlxeUNnjAj6DbNsKyzbg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm64-gnu": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-gnu/-/binding-linux-arm64-gnu-1.2.13.tgz",
      "integrity": "sha512-DTpb/+jMiqWMPgphn4ksW1zW+XLJ6dJJ9FMvnIk9I291LhCctMPhMYJrP5t9p6C9qa3KXadDdUEZHBaPh3kNxQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-arm64-musl": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-arm64-musl/-/binding-linux-arm64-musl-1.2.13.tgz",
      "integrity": "sha512-xU+Kvv9N2A3SY35zFh1FWWNjxbadE/BKeqnkXe7vScU4GZsw757BlVmDLITZEq8DPpk6m7uoDYkK7P+x/uU5Ow==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-ppc64-gnu": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-ppc64-gnu/-/binding-linux-ppc64-gnu-1.2.13.tgz",
      "integrity": "sha512-XMk/hnhh25oQ756Lclb1Q11h4ll0xC0Esa5w4Vzp+mAE2S3AGJgeM0SonrIgY8fHhjarb6hcoTuwoFG0VVP2ig==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-s390x-gnu": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-s390x-gnu/-/binding-linux-s390x-gnu-1.2.13.tgz",
      "integrity": "sha512-U1BoTHYmlywE2n3HUWjzZ+8EQsKr+OwpxYuDWaubx42tUL8QSL7nOqRz/NVHanibbFP3M1Rxuprz/wNcbMKjqw==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-x64-gnu": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-gnu/-/binding-linux-x64-gnu-1.2.13.tgz",
      "integrity": "sha512-J4cm80Pc6wEwV5AZ42o62sIQgDk+Y7R2s646jIwuvO+4V46QB58N4vVuMPWCBaNgursXLpmUWJV//WQAkPvHBQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-linux-x64-musl": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-linux-x64-musl/-/binding-linux-x64-musl-1.2.13.tgz",
      "integrity": "sha512-W0euZS40U4V6JkmEnVCIX9mcsL6cbXQ4X8c2w+MMOIjFg68TXUW+u3RT+2e1t1pv9mg/EP3pDtK3POXdQ7Rxyw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-openharmony-arm64": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-openharmony-arm64/-/binding-openharmony-arm64-1.2.13.tgz",
      "integrity": "sha512-do/AF/4n9MRshia3a5aXoy8xM2c6mgfT6D7H/dY6my5z+hfCIR4ab7mk4IRj++nsEQpKy39kd0DQnDq+r692tw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-win32-arm64-msvc": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-arm64-msvc/-/binding-win32-arm64-msvc-1.2.13.tgz",
      "integrity": "sha512-6FtUf2cJZobutJdxnGYX8z0vtbgqU0b2v8vfBhkXb9wp2MppMFtkunE+IaOntyi01rkIQoPW2GHABtfzsC0BRQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/binding-win32-x64-msvc": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/@rolldown/binding-win32-x64-msvc/-/binding-win32-x64-msvc-1.2.13.tgz",
      "integrity": "sha512-UKhFaZTeTcbKrb3iU82m17jVcPEAoqDkCN5MBqgPyZSwp/cQmib21crTS0DdH7T1B7wZRWEI89YQAOJMet5yhg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      }
    },
    "node_modules/@rolldown/pluginutils": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.1.tgz",
      "integrity": "sha512-2j9bGt5Jh8hj+vPtgzPtl72j0yRxHAyumoo6TNfAjsLB04UtpSvPbPcDcBMxz7n+9CYB0c1GxQFxYRg2jimqGw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@standard-schema/spec": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
      "license": "MIT"
    },
    "node_modules/@standard-schema/utils": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/@standard-schema/utils/-/utils-0.3.0.tgz",
      "integrity": "sha512-e7Mew686owMaPJVNNLs55PUvgz371nKgwsc4vxE49zsODpJEnxgxRo2y/OKrqueavXgZNMDVj3DdHFlaSAeU8g==",
      "license": "MIT"
    },
    "node_modules/@tailwindcss/node": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/node/-/node-4.3.3.tgz",
      "integrity": "sha512-/T8IKEsf9VTU6tLjgC7+sv2mOPtQxzE2jMw7u4Tt40Tx+QSZxpzh95/H6cMKoja9XuW7iMdLJYBB0o9G1CaAgg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/remapping": "^2.3.5",
        "enhanced-resolve": "^5.24.1",
        "jiti": "^2.7.0",
        "lightningcss": "1.32.0",
        "magic-string": "^0.30.21",
        "source-map-js": "^1.2.1",
        "tailwindcss": "4.3.3"
      }
    },
    "node_modules/@tailwindcss/oxide": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide/-/oxide-4.3.3.tgz",
      "integrity": "sha512-krXjAikiaFSPaK/FkAQT5UTx3VormQaiZ5hBFlJZ9UFQGB/rwg1MZIhHAG9smMQRTdyJxP6Qt5MwMtdyU5FWrA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 20"
      },
      "optionalDependencies": {
        "@tailwindcss/oxide-android-arm64": "4.3.3",
        "@tailwindcss/oxide-darwin-arm64": "4.3.3",
        "@tailwindcss/oxide-darwin-x64": "4.3.3",
        "@tailwindcss/oxide-freebsd-x64": "4.3.3",
        "@tailwindcss/oxide-linux-arm-gnueabihf": "4.3.3",
        "@tailwindcss/oxide-linux-arm64-gnu": "4.3.3",
        "@tailwindcss/oxide-linux-arm64-musl": "4.3.3",
        "@tailwindcss/oxide-linux-x64-gnu": "4.3.3",
        "@tailwindcss/oxide-linux-x64-musl": "4.3.3",
        "@tailwindcss/oxide-wasm32-wasi": "4.3.3",
        "@tailwindcss/oxide-win32-arm64-msvc": "4.3.3",
        "@tailwindcss/oxide-win32-x64-msvc": "4.3.3"
      }
    },
    "node_modules/@tailwindcss/oxide-android-arm64": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-android-arm64/-/oxide-android-arm64-4.3.3.tgz",
      "integrity": "sha512-Y85A2gmPSkl5Ve5qR86GL4HT509cFqQh1aes9p3sSkyTPwt0Pppf3GkwGe4JPACcRYjgJIEhQgM6dBClnr0NYw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-arm64": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-arm64/-/oxide-darwin-arm64-4.3.3.tgz",
      "integrity": "sha512-BiaWatpBcERQFDlOjRDpIVXuFK5PJez5SA4JMg6VYZdBYU+qKfV/vqjcIs+IYmtitf1xYQZTwXvU/8y4lfZUGw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-x64": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-x64/-/oxide-darwin-x64-4.3.3.tgz",
      "integrity": "sha512-fAeUqfV5ndhxRwai8cXGzdLvul9utWOmeTkv69unv4ZXixjn61Z+p9lCWdwOwA3TYboG3BwdVuN/RDjhBRl0mw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-freebsd-x64": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-freebsd-x64/-/oxide-freebsd-x64-4.3.3.tgz",
      "integrity": "sha512-iyf5bV6+wnAlflVeEy7R25dupxTNECZN5QMI0qNT6eT+EgaGdZcKhGkr5SdoaWiLJ3spLqIY9VCeSGrwmtg4kw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm-gnueabihf": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm-gnueabihf/-/oxide-linux-arm-gnueabihf-4.3.3.tgz",
      "integrity": "sha512-aAYUprJAJQWWbRrPvtjdroZ56Md+JM8pMiopS6xGEwDfLhqj+2ver2p4nU4Mb3CRqcMmNBjo8KkUgcxhkzVQGQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-gnu": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-gnu/-/oxide-linux-arm64-gnu-4.3.3.tgz",
      "integrity": "sha512-nDxldcEENOxZRzC2uu9jrutZdAAQtb+8WWDCSnWL1zvBk1+FN+x6MtDViPB5AJMfttVCUhehGWus3XBPgatM/w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-musl": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-musl/-/oxide-linux-arm64-musl-4.3.3.tgz",
      "integrity": "sha512-Md44bD6veX/PC5iyF8cDVnw4HBIANZepRZZ7a8DQOvkfo5WUBwcp6iAuCUz23u+4SUkhJlD3eL7hNdW8ezd/kA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-gnu": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-gnu/-/oxide-linux-x64-gnu-4.3.3.tgz",
      "integrity": "sha512-tx7us1muwOKAKWao2v/GaafFeQboE6aj88vC6ziN2NCGcRm8gWUhwjzg+YdVB1e4boAtdtma4L43onunI6NS4w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-musl": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-musl/-/oxide-linux-x64-musl-4.3.3.tgz",
      "integrity": "sha512-SJxX60smvHgasZoBy11dX6YRjXJFovwWBoedhbQPOBzgFWBHGB+TVPWB9BxzR7TTxU8FQZAI2AyiNCMzFm8Img==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-wasm32-wasi": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.3.3.tgz",
      "integrity": "sha512-jx1+rPhY/5Ympkktd656HBWEBLxP7dH06losBLjjf5vgCODXvi9KhtftWcMIwTFIDqBr7cRnQkdLnAG+IOlGvQ==",
      "bundleDependencies": [
        "@napi-rs/wasm-runtime",
        "@emnapi/core",
        "@emnapi/runtime",
        "@tybys/wasm-util",
        "@emnapi/wasi-threads",
        "tslib"
      ],
      "cpu": [
        "wasm32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "^1.11.1",
        "@emnapi/runtime": "^1.11.1",
        "@emnapi/wasi-threads": "^1.2.2",
        "@napi-rs/wasm-runtime": "^1.1.4",
        "@tybys/wasm-util": "^0.10.2",
        "tslib": "^2.8.1"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-arm64-msvc": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-arm64-msvc/-/oxide-win32-arm64-msvc-4.3.3.tgz",
      "integrity": "sha512-3rc292Ca2ceK6Ulcc/bAVnTs/3nDtoPhyEKlgPv+yQJQi/JS/AMJlqzxvlDacL1nekbrcf6bTqp/jV4qgnPxNQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-x64-msvc": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-x64-msvc/-/oxide-win32-x64-msvc-4.3.3.tgz",
      "integrity": "sha512-yJ0pwIVc/nYeGoV02WtsN8KYyLQv7kyI2wDnkezyJlGGjkd4QLwDGAwl47YpPJeuI0M0ObaXGSPjvWDPeTPggw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 20"
      }
    },
    "node_modules/@tailwindcss/vite": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/@tailwindcss/vite/-/vite-4.3.3.tgz",
      "integrity": "sha512-yYU8cogLeSh/ms2jh8Fj7jaba/EWa7Ja6GoUqYZaraEuCI5YS6ms6ObZgjjedm+jm6XZjdNRWBpPP6Z86oOxcw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@tailwindcss/node": "4.3.3",
        "@tailwindcss/oxide": "4.3.3",
        "tailwindcss": "4.3.3"
      },
      "peerDependencies": {
        "vite": "^5.2.0 || ^6 || ^7 || ^8"
      }
    },
    "node_modules/@types/d3-array": {
      "version": "3.2.2",
      "resolved": "https://registry.npmjs.org/@types/d3-array/-/d3-array-3.2.2.tgz",
      "integrity": "sha512-hOLWVbm7uRza0BYXpIIW5pxfrKe0W+D5lrFiAEYR+pb6w3N2SwSMaJbXdUfSEv+dT4MfHBLtn5js0LAWaO6otw==",
      "license": "MIT"
    },
    "node_modules/@types/d3-color": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/@types/d3-color/-/d3-color-3.1.3.tgz",
      "integrity": "sha512-iO90scth9WAbmgv7ogoq57O9YpKmFBbmoEoCHDB2xMBY0+/KVrqAaCDyCE16dUspeOvIxFFRI+0sEtqDqy2b4A==",
      "license": "MIT"
    },
    "node_modules/@types/d3-ease": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-ease/-/d3-ease-3.0.2.tgz",
      "integrity": "sha512-NcV1JjO5oDzoK26oMzbILE6HW7uVXOHLQvHshBUW4UMdZGfiY6v5BeQwh9a9tCzv+CeefZQHJt5SRgK154RtiA==",
      "license": "MIT"
    },
    "node_modules/@types/d3-interpolate": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/d3-interpolate/-/d3-interpolate-3.0.4.tgz",
      "integrity": "sha512-mgLPETlrpVV1YRJIglr4Ez47g7Yxjl1lj7YKsiMCb27VJH9W8NVM6Bb9d8kkpG/uAQS5AmbA48q2IAolKKo1MA==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-color": "*"
      }
    },
    "node_modules/@types/d3-path": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/@types/d3-path/-/d3-path-3.1.1.tgz",
      "integrity": "sha512-VMZBYyQvbGmWyWVea0EHs/BwLgxc+MKi1zLDCONksozI4YJMcTt8ZEuIR4Sb1MMTE8MMW49v0IwI5+b7RmfWlg==",
      "license": "MIT"
    },
    "node_modules/@types/d3-scale": {
      "version": "4.0.9",
      "resolved": "https://registry.npmjs.org/@types/d3-scale/-/d3-scale-4.0.9.tgz",
      "integrity": "sha512-dLmtwB8zkAeO/juAMfnV+sItKjlsw2lKdZVVy6LRr0cBmegxSABiLEpGVmSJJ8O08i4+sGR6qQtb6WtuwJdvVw==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-time": "*"
      }
    },
    "node_modules/@types/d3-shape": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/@types/d3-shape/-/d3-shape-3.2.0.tgz",
      "integrity": "sha512-kVd74ta9eof3eJOvbNd1vGKS/XERRyQbT26Og63hIsvDO84cjD5gEOhsXf26w3FSoNlPVz84DOFcKv/oou+fMw==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-path": "*"
      }
    },
    "node_modules/@types/d3-time": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/d3-time/-/d3-time-3.0.4.tgz",
      "integrity": "sha512-yuzZug1nkAAaBlBBikKZTgzCeA+k1uy4ZFwWANOfKw5z5LRhV0gNA7gNkKm7HoK+HRN0wX3EkxGk0fpbWhmB7g==",
      "license": "MIT"
    },
    "node_modules/@types/d3-timer": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-timer/-/d3-timer-3.0.2.tgz",
      "integrity": "sha512-Ps3T8E8dZDam6fUyNiMkekK3XUsaUEik+idO9/YjPtfj2qruF8tFBXS7XhtE4iIXBLxhmLjP3SXpLhVf21I9Lw==",
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "22.20.5",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-22.20.5.tgz",
      "integrity": "sha512-U2+DNr+wSjpsTS/wZGYHq7GcwfuSmKiKvoPvK22zwTlRhU91yOniN4qRR5KhIjvif7ysw/dz/hKmfDH0Ris4aA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.21.0"
      }
    },
    "node_modules/@types/react": {
      "version": "19.3.0",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-19.3.0.tgz",
      "integrity": "sha512-N0rFCuH9YoxG9/m61l9MfpJKfmLOVU0em7ipIz6TRgSSkvReLB9vL85GB+yr8Bs5leqpvg96JSwF4ZS1s4viQg==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "csstype": "^3.2.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "19.3.0",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-19.3.0.tgz",
      "integrity": "sha512-ZI7bU42mZXXKHn/qNLEw2IrbiINU7X5+vfgdixBHkCNpYWXjKgfQ/P+uyGb5CjOLB9UcnTeg3rylQtV2hym44Q==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "^19.3.0"
      }
    },
    "node_modules/@types/use-sync-external-store": {
      "version": "0.0.6",
      "resolved": "https://registry.npmjs.org/@types/use-sync-external-store/-/use-sync-external-store-0.0.6.tgz",
      "integrity": "sha512-zFDAD+tlpf2r4asuHEj0XH6pY6i0g5NeAHPn+15wk3BV6JA69eERFXC1gyGThDkVa1zCyKr5jox1+2LbV/AMLg==",
      "license": "MIT"
    },
    "node_modules/@vitejs/plugin-react": {
      "version": "6.1.2",
      "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-6.1.2.tgz",
      "integrity": "sha512-fhJNGUdscQa4HkI0xFxwonWyhnVReCPDbXI7FH7jmzpnVCrFQI7PRrhWecO263610vOrs9tr2Y4xcf8uAdFxbw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@rolldown/pluginutils": "^1.0.1"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "peerDependencies": {
        "@rolldown/plugin-babel": "^0.1.7 || ^0.2.0",
        "babel-plugin-react-compiler": "^1.0.0",
        "oxc-transform-react": "^0.152.0",
        "vite": "^8.0.0"
      },
      "peerDependenciesMeta": {
        "@rolldown/plugin-babel": {
          "optional": true
        },
        "babel-plugin-react-compiler": {
          "optional": true
        },
        "oxc-transform-react": {
          "optional": true
        }
      }
    },
    "node_modules/clsx": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/clsx/-/clsx-2.1.1.tgz",
      "integrity": "sha512-eYm0QWBtUrBWZWG0d386OGAw16Z995PiOVo2B7bjWSbHedGl5e0ZWaq65kOGgUSNesEIDkB9ISbTg/JK9dhCZA==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/cookie": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz",
      "integrity": "sha512-ei8Aos7ja0weRpFzJnEA9UHJ/7XQmqglbRwnf2ATjcB9Wq874VKH9kfjjirM6UhU2/E5fFYadylyhFldcqSidQ==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/csstype": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/d3-array": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/d3-array/-/d3-array-3.2.4.tgz",
      "integrity": "sha512-tdQAmyA18i4J7wprpYq8ClcxZy3SC31QMeByyCFyRt7BVHdREQZ5lpzoe5mFEYZUWe+oq8HBvk9JjpibyEV4Jg==",
      "license": "ISC",
      "dependencies": {
        "internmap": "1 - 2"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-color": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-color/-/d3-color-3.1.0.tgz",
      "integrity": "sha512-zg/chbXyeBtMQ1LbD/WSoW2DpC3I0mpmPdW+ynRTj/x2DAWYrIY7qeZIHidozwV24m4iavr15lNwIwLxRmOxhA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-ease": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-ease/-/d3-ease-3.0.1.tgz",
      "integrity": "sha512-wR/XK3D3XcLIZwpbvQwQ5fK+8Ykds1ip7A2Txe0yxncXSdq1L9skcG7blcedkOX+ZcgxGAmLX1FrRGbADwzi0w==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-format": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/d3-format/-/d3-format-3.1.2.tgz",
      "integrity": "sha512-AJDdYOdnyRDV5b6ArilzCPPwc1ejkHcoyFarqlPqT7zRYjhavcT3uSrqcMvsgh2CgoPbK3RCwyHaVyxYcP2Arg==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-interpolate": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-interpolate/-/d3-interpolate-3.0.1.tgz",
      "integrity": "sha512-3bYs1rOD33uo8aqJfKP3JWPAibgw8Zm2+L9vBKEHJ2Rg+viTR7o5Mmv5mZcieN+FRYaAOWX5SJATX6k1PWz72g==",
      "license": "ISC",
      "dependencies": {
        "d3-color": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-path": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-path/-/d3-path-3.1.0.tgz",
      "integrity": "sha512-p3KP5HCf/bvjBSSKuXid6Zqijx7wIfNW+J/maPs+iwR35at5JCbLUT0LzF1cnjbCHWhqzQTIN2Jpe8pRebIEFQ==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-scale": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/d3-scale/-/d3-scale-4.0.2.tgz",
      "integrity": "sha512-GZW464g1SH7ag3Y7hXjf8RoUuAFIqklOAq3MRl4OaWabTFJY9PN/E1YklhXLh+OQ3fM9yS2nOkCoS+WLZ6kvxQ==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2.10.0 - 3",
        "d3-format": "1 - 3",
        "d3-interpolate": "1.2.0 - 3",
        "d3-time": "2.1.1 - 3",
        "d3-time-format": "2 - 4"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-shape": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/d3-shape/-/d3-shape-3.2.0.tgz",
      "integrity": "sha512-SaLBuwGm3MOViRq2ABk3eLoxwZELpH6zhl3FbAoJ7Vm1gofKx6El1Ib5z23NUEhF9AsGl7y+dzLe5Cw2AArGTA==",
      "license": "ISC",
      "dependencies": {
        "d3-path": "^3.1.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-time/-/d3-time-3.1.0.tgz",
      "integrity": "sha512-VqKjzBLejbSMT4IgbmVgDjpkYrNWUYJnbCGo874u7MMKIWsILRX+OpX/gTk8MqjpT1A/c6HY2dCA77ZN0lkQ2Q==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time-format": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/d3-time-format/-/d3-time-format-4.1.0.tgz",
      "integrity": "sha512-dJxPBlzC7NugB2PDLwo9Q8JiTR3M3e4/XANkreKSUxF8vvXKqm1Yfq4Q5dl8budlunRVlUUaDUgFt7eA8D6NLg==",
      "license": "ISC",
      "dependencies": {
        "d3-time": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-timer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-timer/-/d3-timer-3.0.1.tgz",
      "integrity": "sha512-ndfJ/JxxMd3nw31uyKoY2naivF+r29V+Lc0svZxe1JvvIRmi8hUsrMvdOwgS1o6uBHmiz91geQ0ylPP0aj1VUA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/decimal.js-light": {
      "version": "2.5.1",
      "resolved": "https://registry.npmjs.org/decimal.js-light/-/decimal.js-light-2.5.1.tgz",
      "integrity": "sha512-qIMFpTMZmny+MMIitAB6D7iVPEorVw6YQRWkvarTkT4tBeSLLiHzcwj6q0MmYSFCiVpiqPJTJEYIrpcPzVEIvg==",
      "license": "MIT"
    },
    "node_modules/detect-libc": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/enhanced-resolve": {
      "version": "5.26.0",
      "resolved": "https://registry.npmjs.org/enhanced-resolve/-/enhanced-resolve-5.26.0.tgz",
      "integrity": "sha512-9vhedylFonb2YGogzUKX6+Ja72gOJbN1QHAqdrvqLwhdl/QWbKopzoUC9EbQNVsAns/bx/4uyqalrQAoy1IByw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "graceful-fs": "^4.2.4",
        "tapable": "^2.3.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/es-toolkit": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/es-toolkit/-/es-toolkit-1.52.0.tgz",
      "integrity": "sha512-XTNEJQh1tY1ZJVcf6ayP/2n4ZPyaHlW2FWs7xvw5ddPuhUVjLD3olQVQS7kf58JbAB48iL0uL/jerTrjtV3lDA==",
      "license": "MIT",
      "workspaces": [
        "docs",
        "benchmarks",
        "tests/types",
        "tests/browser-compat"
      ]
    },
    "node_modules/eventemitter3": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-5.0.4.tgz",
      "integrity": "sha512-mlsTRyGaPBjPedk6Bvw+aqbsXDtoAyAzm5MO7JgU+yVRyMQ5O8bD4Kcci7BS85f93veegeCPkL8R4GLClnjLFw==",
      "license": "MIT"
    },
    "node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/immer": {
      "version": "11.1.21",
      "resolved": "https://registry.npmjs.org/immer/-/immer-11.1.21.tgz",
      "integrity": "sha512-bZSadeCPGdaY5/qRLgr6mDSH1ra21rD3rqpiWk7+QTr4ayYPTE9qZYdLh/NdPhMe0wSrTvHD/Lk8q5EwhUs0aw==",
      "license": "MIT",
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/immer"
      }
    },
    "node_modules/internmap": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/internmap/-/internmap-2.0.3.tgz",
      "integrity": "sha512-5Hh7Y1wQbvY5ooGgPbDaL5iYLAPzMTUrjMulskHLH6wnv/A+1q5rgEaiuqEjB+oxGXIVZs1FF+R/KPN3ZSQYYg==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/jiti": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-2.7.0.tgz",
      "integrity": "sha512-AC/7JofJvZGrrneWNaEnJeOLUx+JlGt7tNa0wZiRPT4MY1wmfKjt2+6O2p2uz2+skll8OZZmJMNqeke7kKbNgQ==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jiti": "lib/jiti-cli.mjs"
      }
    },
    "node_modules/lightningcss": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.32.0.tgz",
      "integrity": "sha512-NXYBzinNrblfraPGyrbPoD19C1h9lfI/1mzgWYvXUTe414Gz/X1FD2XBZSZM7rRTrMA8JL3OtAaGifrIKhQ5yQ==",
      "dev": true,
      "license": "MPL-2.0",
      "dependencies": {
        "detect-libc": "^2.0.3"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "lightningcss-android-arm64": "1.32.0",
        "lightningcss-darwin-arm64": "1.32.0",
        "lightningcss-darwin-x64": "1.32.0",
        "lightningcss-freebsd-x64": "1.32.0",
        "lightningcss-linux-arm-gnueabihf": "1.32.0",
        "lightningcss-linux-arm64-gnu": "1.32.0",
        "lightningcss-linux-arm64-musl": "1.32.0",
        "lightningcss-linux-x64-gnu": "1.32.0",
        "lightningcss-linux-x64-musl": "1.32.0",
        "lightningcss-win32-arm64-msvc": "1.32.0",
        "lightningcss-win32-x64-msvc": "1.32.0"
      }
    },
    "node_modules/lightningcss-android-arm64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.32.0.tgz",
      "integrity": "sha512-YK7/ClTt4kAK0vo6w3X+Pnm0D2cf2vPHbhOXdoNti1Ga0al1P4TBZhwjATvjNwLEBCnKvjJc2jQgHXH0NEwlAg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-arm64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.32.0.tgz",
      "integrity": "sha512-RzeG9Ju5bag2Bv1/lwlVJvBE3q6TtXskdZLLCyfg5pt+HLz9BqlICO7LZM7VHNTTn/5PRhHFBSjk5lc4cmscPQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-x64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.32.0.tgz",
      "integrity": "sha512-U+QsBp2m/s2wqpUYT/6wnlagdZbtZdndSmut/NJqlCcMLTWp5muCrID+K5UJ6jqD2BFshejCYXniPDbNh73V8w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-freebsd-x64": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.32.0.tgz",
      "integrity": "sha512-JCTigedEksZk3tHTTthnMdVfGf61Fky8Ji2E4YjUTEQX14xiy/lTzXnu1vwiZe3bYe0q+SpsSH/CTeDXK6WHig==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm-gnueabihf": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.32.0.tgz",
      "integrity": "sha512-x6rnnpRa2GL0zQOkt6rts3YDPzduLpWvwAF6EMhXFVZXD4tPrBkEFqzGowzCsIWsPjqSK+tyNEODUBXeeVHSkw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-gnu": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.32.0.tgz",
      "integrity": "sha512-0nnMyoyOLRJXfbMOilaSRcLH3Jw5z9HDNGfT/gwCPgaDjnx0i8w7vBzFLFR1f6CMLKF8gVbebmkUN3fa/kQJpQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-musl": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.32.0.tgz",
      "integrity": "sha512-UpQkoenr4UJEzgVIYpI80lDFvRmPVg6oqboNHfoH4CQIfNA+HOrZ7Mo7KZP02dC6LjghPQJeBsvXhJod/wnIBg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-gnu": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.32.0.tgz",
      "integrity": "sha512-V7Qr52IhZmdKPVr+Vtw8o+WLsQJYCTd8loIfpDaMRWGUZfBOYEJeyJIkqGIDMZPwPx24pUMfwSxxI8phr/MbOA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-musl": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.32.0.tgz",
      "integrity": "sha512-bYcLp+Vb0awsiXg/80uCRezCYHNg1/l3mt0gzHnWV9XP1W5sKa5/TCdGWaR/zBM2PeF/HbsQv/j2URNOiVuxWg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-arm64-msvc": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.32.0.tgz",
      "integrity": "sha512-8SbC8BR40pS6baCM8sbtYDSwEVQd4JlFTOlaD3gWGHfThTcABnNDBda6eTZeqbofalIJhFx0qKzgHJmcPTnGdw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-x64-msvc": {
      "version": "1.32.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.32.0.tgz",
      "integrity": "sha512-Amq9B/SoZYdDi1kFrojnoqPLxYhQ4Wo5XiL8EVJrVsB8ARoC1PWW6VGtT0WKCemjy8aC+louJnjS7U18x3b06Q==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/magic-string": {
      "version": "0.30.21",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.5"
      }
    },
    "node_modules/nanoid": {
      "version": "3.3.20",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.20.tgz",
      "integrity": "sha512-uKdg2G3GNCKQn9byYOpxbGqrT2fGO5KRt5J/8b3pok8rT6qxGWF6hxMyJiEYtAf+FVyYuD9hRaDqX5uPFYJ4ZQ==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/oxfmt": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/oxfmt/-/oxfmt-0.2.0.tgz",
      "integrity": "sha512-99bPAiYDiYikUej8U0Slv8pcFVbMe38Ulm+T6bJ4KQgm+UsbgTKCBpWxbD/LRz1CuYw3PRpqfPv6AkQsIAo3Ag==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "oxfmt": "bin/oxfmt"
      },
      "engines": {
        "node": ">=8.*"
      },
      "funding": {
        "url": "https://github.com/sponsors/Boshen"
      },
      "optionalDependencies": {
        "@oxfmt/darwin-arm64": "0.2.0",
        "@oxfmt/darwin-x64": "0.2.0",
        "@oxfmt/linux-arm64-gnu": "0.2.0",
        "@oxfmt/linux-arm64-musl": "0.2.0",
        "@oxfmt/linux-x64-gnu": "0.2.0",
        "@oxfmt/linux-x64-musl": "0.2.0",
        "@oxfmt/win32-arm64": "0.2.0",
        "@oxfmt/win32-x64": "0.2.0"
      }
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz",
      "integrity": "sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pngjs": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/pngjs/-/pngjs-7.0.0.tgz",
      "integrity": "sha512-LKWqWJRhstyYo9pGvgor/ivk2w94eSjE3RGVuzLGlr3NmD8bf7RcYGze1mNdEHRP6TRP6rMuDHk5t44hnTRyow==",
      "license": "MIT",
      "engines": {
        "node": ">=14.19.0"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.29",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.29.tgz",
      "integrity": "sha512-49cGhUbXj8Qenv0iTMxA1cFBzxXoctpC9Ujd77t1WcbJIr6nF/eI7g/8MgxrYldFRuAXvja7xQRwavoW7kgrxQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.19",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/react": {
      "version": "19.3.0",
      "resolved": "https://registry.npmjs.org/react/-/react-19.3.0.tgz",
      "integrity": "sha512-E8LUcbtBWt20bbl2YoHfx4ZDBdxVTfOKtCZn9cDSJ4l6/nuoApcpIBcj47t2wZoVX8g2ZHuMHbiShgCR1T5Sog==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-dom": {
      "version": "19.3.0",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-19.3.0.tgz",
      "integrity": "sha512-JDk8dgif51OjFoDE70+OT9ICyYr+69HlmihNwp1+Nsfbna3t5sIiCa9ZJktDmQ4/1b/rn26hIAR2uYXDMr5r0Q==",
      "license": "MIT",
      "dependencies": {
        "scheduler": "^0.28.0"
      },
      "peerDependencies": {
        "react": "^19.3.0"
      }
    },
    "node_modules/react-is": {
      "version": "19.3.0",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-19.3.0.tgz",
      "integrity": "sha512-UpMYezM4v5/18F28aC66AEsjXIgE02kyEMH6yLdgLXu/UTfa1Ntwck/nNLrbqJsEXW7gPb0coNO9FQse9WTovA==",
      "license": "MIT",
      "peer": true
    },
    "node_modules/react-redux": {
      "version": "9.3.0",
      "resolved": "https://registry.npmjs.org/react-redux/-/react-redux-9.3.0.tgz",
      "integrity": "sha512-KQopgqFo/p/fgmAs5qz6p5RWaNAzq40WAu7fJIXnQpYxFPbJYtsJPWvGeF2rOBaY/kEuV77AVsX8TsQzKm+A/g==",
      "license": "MIT",
      "dependencies": {
        "@types/use-sync-external-store": "^0.0.6",
        "use-sync-external-store": "^1.4.0"
      },
      "peerDependencies": {
        "@types/react": "^18.2.25 || ^19",
        "react": "^18.0 || ^19",
        "redux": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "redux": {
          "optional": true
        }
      }
    },
    "node_modules/react-router": {
      "version": "7.18.4",
      "resolved": "https://registry.npmjs.org/react-router/-/react-router-7.18.4.tgz",
      "integrity": "sha512-PUPQcMhMGRAslLcvtlPz/kmzBEWPhLdgLFrL7pLNepBL6dX0lWj4WD2cUYVgYCuT3jxvghYFg81cDTj44DhetQ==",
      "license": "MIT",
      "dependencies": {
        "cookie": "^1.0.1",
        "set-cookie-parser": "^2.6.0"
      },
      "engines": {
        "node": ">=20.0.0"
      },
      "peerDependencies": {
        "react": ">=18",
        "react-dom": ">=18"
      },
      "peerDependenciesMeta": {
        "react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/react-router-dom": {
      "version": "7.18.4",
      "resolved": "https://registry.npmjs.org/react-router-dom/-/react-router-dom-7.18.4.tgz",
      "integrity": "sha512-yrfmJHIpDG7taCpqKjT1G5B6q3O2K+RN8/fgNf0lTjCwiPbQ0ei6vXX9ZjQR+7ld8Tr7Z5xmyMnZ8YJrphWQUw==",
      "license": "MIT",
      "dependencies": {
        "react-router": "7.18.4"
      },
      "engines": {
        "node": ">=20.0.0"
      },
      "peerDependencies": {
        "react": ">=18",
        "react-dom": ">=18"
      }
    },
    "node_modules/recharts": {
      "version": "3.10.1",
      "resolved": "https://registry.npmjs.org/recharts/-/recharts-3.10.1.tgz",
      "integrity": "sha512-QXFrvt6IVcw7eeZCoyXTwkIJAX3Dv1nyVhMicXJ47GsGDDpcN8z6o644DibE9XjpBTThtsomLKnTV6lc+cVFUA==",
      "license": "MIT",
      "workspaces": [
        "www"
      ],
      "dependencies": {
        "@reduxjs/toolkit": "^1.9.0 || 2.x.x",
        "clsx": "^2.1.1",
        "decimal.js-light": "^2.5.1",
        "es-toolkit": "^1.39.3",
        "eventemitter3": "^5.0.1",
        "immer": "^11.1.8",
        "react-redux": "8.x.x || 9.x.x",
        "reselect": "5.2.0",
        "tiny-invariant": "^1.3.3",
        "use-sync-external-store": "^1.2.2",
        "victory-vendor": "^37.0.2"
      },
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-dom": "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-is": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/redux": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/redux/-/redux-5.0.1.tgz",
      "integrity": "sha512-M9/ELqF6fy8FwmkpnF0S3YKOqMyoWJ4+CS5Efg2ct3oY9daQvd/Pc71FpGZsVsbl3Cpb+IIcjBDUnnyBdQbq4w==",
      "license": "MIT"
    },
    "node_modules/redux-thunk": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/redux-thunk/-/redux-thunk-3.1.0.tgz",
      "integrity": "sha512-NW2r5T6ksUKXCabzhL9z+h206HQw/NJkcLm1GPImRQ8IzfXwRGqjVhKJGauHirT0DAuyy6hjdnMZaRoAcy0Klw==",
      "license": "MIT",
      "peerDependencies": {
        "redux": "^5.0.0"
      }
    },
    "node_modules/reselect": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/reselect/-/reselect-5.2.0.tgz",
      "integrity": "sha512-AgZ3UOZm3YndfrJ4OYjgrT7bmCm/1iqkjvEfH/oYjzh6PD2qw4QuT3jjnXIrpdt4MTpMXclMT3lXbmRY+XRakw==",
      "license": "MIT"
    },
    "node_modules/rolldown": {
      "version": "1.2.13",
      "resolved": "https://registry.npmjs.org/rolldown/-/rolldown-1.2.13.tgz",
      "integrity": "sha512-/5apOkwWxtACcQtZ5WlrAsKS4JwXVThQPJZ3RqIruRY9UG9M8e0VlXN068xum/JRKA4aIUoJ13ghe/kGCvidiQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@oxc-project/types": "=0.153.0",
        "@rolldown/pluginutils": "^1.0.0"
      },
      "bin": {
        "rolldown": "bin/cli.mjs"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "optionalDependencies": {
        "@rolldown/binding-android-arm-eabi": "1.2.13",
        "@rolldown/binding-android-arm64": "1.2.13",
        "@rolldown/binding-darwin-arm64": "1.2.13",
        "@rolldown/binding-darwin-x64": "1.2.13",
        "@rolldown/binding-freebsd-x64": "1.2.13",
        "@rolldown/binding-linux-arm-gnueabihf": "1.2.13",
        "@rolldown/binding-linux-arm64-gnu": "1.2.13",
        "@rolldown/binding-linux-arm64-musl": "1.2.13",
        "@rolldown/binding-linux-ppc64-gnu": "1.2.13",
        "@rolldown/binding-linux-s390x-gnu": "1.2.13",
        "@rolldown/binding-linux-x64-gnu": "1.2.13",
        "@rolldown/binding-linux-x64-musl": "1.2.13",
        "@rolldown/binding-openharmony-arm64": "1.2.13",
        "@rolldown/binding-win32-arm64-msvc": "1.2.13",
        "@rolldown/binding-win32-x64-msvc": "1.2.13"
      }
    },
    "node_modules/scheduler": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.28.0.tgz",
      "integrity": "sha512-juorfCmIkIw8tT+p5BXSm6PJjQF/ycEYmKyzURCIt/RaZIhL+PulbQ9Yu2z1HdOJDdqDTlxA1+xKBmHXJsczAw==",
      "license": "MIT"
    },
    "node_modules/set-cookie-parser": {
      "version": "2.7.2",
      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.7.2.tgz",
      "integrity": "sha512-oeM1lpU/UvhTxw+g3cIfxXHyJRc/uidd3yK1P242gzHds0udQBYzs3y8j4gCCW+ZJ7ad0yctld8RYO+bdurlvw==",
      "license": "MIT"
    },
    "node_modules/source-map-js": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.2.tgz",
      "integrity": "sha512-KGj/8Y43x35aZVDtt+J4mK1hoLGHULMYfSkODJNQjNDC3oW1PqPoxMwo0pLUsWM/UEGzON/NxeHywEfNXNP3Vw==",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/tailwindcss": {
      "version": "4.3.3",
      "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-4.3.3.tgz",
      "integrity": "sha512-gOhV3P7ufE62QDGg1zVaTgCR+EtPv92k2nIhVcVKcLmxT1sUBsQGhnZj175j+MqRt4zLF7ic+sCYjfhxMxj7YQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tapable": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/tapable/-/tapable-2.3.3.tgz",
      "integrity": "sha512-uxc/zpqFg6x7C8vOE7lh6Lbda8eEL9zmVm/PLeTPBRhh1xCgdWaQ+J1CUieGpIfm2HdtsUpRv+HshiasBMcc6A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/tiny-invariant": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/tiny-invariant/-/tiny-invariant-1.3.3.tgz",
      "integrity": "sha512-+FbBPE1o9QAYvviau/qC5SE3caw21q3xkvWKBtja5vgqOWIHHJ3ioaq1VPfn/Szqctz2bU/oYeKd9/z5BL+PVg==",
      "license": "MIT"
    },
    "node_modules/tinyglobby": {
      "version": "0.2.17",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
      "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.4"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/undici-types": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
      "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/use-sync-external-store": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.7.0.tgz",
      "integrity": "sha512-6L+EeigHMQhdaIPNIFUKwfWJSwWFQ8gJbJ2DLOs5sDIegTwR9fRxvnM3uciHKjIZhFz+KAv2emhWMRvDmMcY8A==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/victory-vendor": {
      "version": "37.3.6",
      "resolved": "https://registry.npmjs.org/victory-vendor/-/victory-vendor-37.3.6.tgz",
      "integrity": "sha512-SbPDPdDBYp+5MJHhBCAyI7wKM3d5ivekigc2Dk2s7pgbZ9wIgIBYGVw4zGHBml/qTFbexrofXW6Gu4noGxrOwQ==",
      "license": "MIT AND ISC",
      "dependencies": {
        "@types/d3-array": "^3.0.3",
        "@types/d3-ease": "^3.0.0",
        "@types/d3-interpolate": "^3.0.1",
        "@types/d3-scale": "^4.0.2",
        "@types/d3-shape": "^3.1.0",
        "@types/d3-time": "^3.0.0",
        "@types/d3-timer": "^3.0.0",
        "d3-array": "^3.1.6",
        "d3-ease": "^3.0.1",
        "d3-interpolate": "^3.0.1",
        "d3-scale": "^4.0.2",
        "d3-shape": "^3.1.0",
        "d3-time": "^3.0.0",
        "d3-timer": "^3.0.1"
      }
    },
    "node_modules/vite": {
      "version": "8.3.4",
      "resolved": "https://registry.npmjs.org/vite/-/vite-8.3.4.tgz",
      "integrity": "sha512-IftLE8phJhdNRIGNEV4JCCvfNScoZQVfcXaN8TQropWGJtOHcu+iAB9pHcuGvmEb/kddw0LBe/jS8ztdC6xdiQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "lightningcss": "^1.33.0",
        "picomatch": "^4.0.7",
        "postcss": "^8.5.29",
        "rolldown": "~1.2.12",
        "tinyglobby": "^0.2.17"
      },
      "bin": {
        "vite": "bin/vite.js"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "funding": {
        "url": "https://github.com/vitejs/vite?sponsor=1"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      },
      "peerDependencies": {
        "@types/node": "^20.19.0 || >=22.12.0",
        "@vitejs/devtools": "^0.7.1",
        "esbuild": "^0.27.0 || ^0.28.0",
        "jiti": ">=1.21.0",
        "less": "^4.0.0",
        "sass": "^1.70.0",
        "sass-embedded": "^1.70.0",
        "stylus": ">=0.54.8",
        "sugarss": "^5.0.0",
        "terser": "^5.16.0",
        "tsx": "^4.8.1",
        "yaml": "^2.4.2"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "@vitejs/devtools": {
          "optional": true
        },
        "esbuild": {
          "optional": true
        },
        "jiti": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        },
        "stylus": {
          "optional": true
        },
        "sugarss": {
          "optional": true
        },
        "terser": {
          "optional": true
        },
        "tsx": {
          "optional": true
        },
        "yaml": {
          "optional": true
        }
      }
    },
    "node_modules/vite/node_modules/lightningcss": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.33.0.tgz",
      "integrity": "sha512-WkUDrojuJs0xkgGf2udWxa3yGBRxPtxUkB79i6aCZLRgc7PM8fZe9TosfPDcvEpQZbuFASnHYmRLBLUbmLOIIA==",
      "dev": true,
      "license": "MPL-2.0",
      "dependencies": {
        "detect-libc": "^2.0.3"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "lightningcss-android-arm64": "1.33.0",
        "lightningcss-darwin-arm64": "1.33.0",
        "lightningcss-darwin-x64": "1.33.0",
        "lightningcss-freebsd-x64": "1.33.0",
        "lightningcss-linux-arm-gnueabihf": "1.33.0",
        "lightningcss-linux-arm64-gnu": "1.33.0",
        "lightningcss-linux-arm64-musl": "1.33.0",
        "lightningcss-linux-x64-gnu": "1.33.0",
        "lightningcss-linux-x64-musl": "1.33.0",
        "lightningcss-win32-arm64-msvc": "1.33.0",
        "lightningcss-win32-x64-msvc": "1.33.0"
      }
    },
    "node_modules/vite/node_modules/lightningcss-android-arm64": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.33.0.tgz",
      "integrity": "sha512-gEpRTalKdosp4Bb8qWtc2iOgE5SeIHlpS1up9bFq2wAyYhl1UdTObYiHe98zEM9SQvSoqQZ1IQD0JNpg3Ml5pg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-darwin-arm64": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.33.0.tgz",
      "integrity": "sha512-Sciaz8eenNTKn9b3t7+xr0ipTp9YxKQY4npwQ3mrRuL0BAVHBLyZxofhaKBAVtzmtRZ/zTyo0/to4B1uWG/Djg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-darwin-x64": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.33.0.tgz",
      "integrity": "sha512-Z5UPAxzrjlWNNyGy6i65cJzzvgJ5D3T6wMvs+gWpY9d7qRhANrxqAp6LhxIgZhWEw18RfJTGcRxjuLIBr+m8XQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-freebsd-x64": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.33.0.tgz",
      "integrity": "sha512-QQM/Ti/hQajJwCY+RiWuCZ9sdtI/XQk7nDK5vC8kkdwixezOlDgvDx7+RT+QjK6FcFT4MpsuoBnHIo/O3StRRg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-linux-arm-gnueabihf": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.33.0.tgz",
      "integrity": "sha512-N7FVBe6iS24MlM6R/4RBTxGhQheZGs7tiQ9U32UtF75NzP5Q7xWPRqLBCKxlRQRk3rY1jCIPLzx7WzOhuUIRLQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-linux-arm64-gnu": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.33.0.tgz",
      "integrity": "sha512-j2v/itmy4HlNxlc6voKXYgBqNi0Ng2LShg4z7GufpEgs05P+2suBVyi9I6YHq5uoVFx9ETin3eCEhLVyXGQnKg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-linux-arm64-musl": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.33.0.tgz",
      "integrity": "sha512-yiO5ROMuYQgXbC60yjZU5CYSFZGKXL0HFATXt9mHJn1+zW55oCtMI9NfcVhYLMFDL7gV7oBPon/EmMMGg2OvtQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-linux-x64-gnu": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.33.0.tgz",
      "integrity": "sha512-ar+Ju7LmcN0Jo4FpL4hpFybwNG9/3A/Br5KW2n2jyODg3MEZXaDYADdemoNS+BDNfMgKvylJLj4S5tyRActuAg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-linux-x64-musl": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.33.0.tgz",
      "integrity": "sha512-RYiYbkokw0trfKqqzfF55lginwEPrD3OJDfTuJzFs1MK6iFnDenaz1fqLLtX4ITG3OktJQXOeTaw1awrBAlZPw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-win32-arm64-msvc": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.33.0.tgz",
      "integrity": "sha512-1K+MPfLSFVpphzpdbfkhlWk6wBrTObBzS2T6db10PNOZgR9GoVsAWzwNyuhUYYbTp23j+4RrncfujZ4uAzXvwA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/vite/node_modules/lightningcss-win32-x64-msvc": {
      "version": "1.33.0",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.33.0.tgz",
      "integrity": "sha512-OlEICDx/Xl0FqSp4bry8zFnCvGpig3Gl4gCquvYwHuqJKEC1+n9NgDniFvqHGmMv1ZkqDJrDqKKSykTDX+ehuA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    }
  }
}
```


################################################################################
### FILE 5/54: `package.json`
################################################################################

```json
{
  "name": "figma-make-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "format": "oxfmt"
  },
  "dependencies": {
    "pngjs": "^7.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.18.4",
    "recharts": "^3.10.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^6.0.0",
    "oxfmt": "^0.2.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^8.0.5"
  }
}
```


################################################################################
### FILE 6/54: `src/App.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

/* ── Screens ── */
import Dashboard from "./screens/Dashboard";
import AttackSimulation from "./screens/AttackSimulation";
import Devices from "./screens/Devices";
import DeviceDetail from "./screens/DeviceDetail";
import Incidents from "./screens/Incidents";
import IncidentDetail from "./screens/IncidentDetail";
import CaseMemory from "./screens/CaseMemory";
import CaseDetail from "./screens/CaseDetail";
import Evaluation from "./screens/Evaluation";
import AuditLog from "./screens/AuditLog";
import Reports from "./screens/Reports";
import SystemHealth from "./screens/SystemHealth";

/* ── Components ── */
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

/* ── Auth Screens ── */
import Login from "./screens/Login";
import ForgotPassword from "./screens/ForgotPassword";
import ResetPassword from "./screens/ResetPassword";
import AcceptInvitation from "./screens/AcceptInvitation";
import VerifyEmail from "./screens/VerifyEmail";

/* ── Marketing Screens ── */
import MarketingLayout from "./marketing/MarketingLayout";
import Home from "./marketing/Home";
import Platform from "./marketing/Platform";
import Solutions from "./marketing/Solutions";
import Integrations from "./marketing/Integrations";
import SecurityCompliance from "./marketing/SecurityCompliance";
import Resources from "./marketing/Resources";
import About from "./marketing/About";
import Contact from "./marketing/Contact";

import type { Screen } from "./types";

/* ── Helpers ── */
function pathToScreen(pathname: string): Screen {
  const map: Record<string, Screen> = {
    "/dashboard":              "dashboard",
    "/simulation":             "simulation-configure",
    "/simulation/running":     "simulation-running",
    "/simulation/result":      "simulation-result",
    "/devices":                "devices",
    "/devices/detail":         "device-detail",
    "/incidents":              "incidents",
    "/incidents/overview":     "incident-overview",
    "/incidents/safereuse":    "incident-safereuse",
    "/incidents/response":     "incident-response",
    "/cases":                  "case-memory",
    "/cases/detail":           "case-detail",
    "/evaluation":             "evaluation",
    "/audit":                  "audit-log",
    "/reports":                "reports",
    "/system":                 "system-health",
    "/settings":               "settings",
  };
  return map[pathname] ?? "dashboard";
}

function screenToPath(screen: Screen): string {
  const map: Record<Screen, string> = {
    "login":                  "/login",
    "dashboard":              "/dashboard",
    "simulation-configure":   "/simulation",
    "simulation-running":     "/simulation/running",
    "simulation-result":      "/simulation/result",
    "devices":                "/devices",
    "device-detail":          "/devices/detail",
    "incidents":              "/incidents",
    "incident-overview":      "/incidents/overview",
    "incident-safereuse":     "/incidents/safereuse",
    "incident-response":      "/incidents/response",
    "case-memory":            "/cases",
    "case-detail":            "/cases/detail",
    "evaluation":             "/evaluation",
    "audit-log":              "/audit",
    "reports":                "/reports",
    "system-health":          "/system",
    "settings":               "/settings",
    "forgot-password":        "/forgot-password",
    "reset-password":         "/reset-password",
    "accept-invitation":      "/accept-invitation",
    "verify-email":           "/verify-email",
  };
  return map[screen] ?? "/dashboard";
}

/* ── Authenticated shell ── */
function AuthenticatedApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [incidentTab, setIncidentTab] = useState<"overview" | "safereuse" | "response">("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentScreen = pathToScreen(location.pathname);

  function handleNavigate(s: Screen) {
    if (s.startsWith("incident-")) {
      const tab = s.replace("incident-", "") as "overview" | "safereuse" | "response";
      setIncidentTab(tab);
    }
    navigate(screenToPath(s));
  }

  // Role guard: only admin can reach audit-log
  if (currentScreen === "audit-log" && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const simView =
    currentScreen === "simulation-running" ? "running"
    : currentScreen === "simulation-result" ? "result"
    : "configure";

  return (
    <div className="h-full flex" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <Sidebar
        screen={currentScreen}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar
          screen={currentScreen}
          onNavigate={handleNavigate}
          onToggleSidebar={() => setSidebarCollapsed(c => !c)}
        />

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-hidden relative">
          <Routes>
            <Route path="/dashboard"      element={<Dashboard onNavigate={handleNavigate} />} />
            <Route path="/simulation/*"   element={<AttackSimulation onNavigate={handleNavigate} />} />
            <Route path="/devices"        element={<Devices onNavigate={handleNavigate} />} />
            <Route path="/devices/detail" element={<DeviceDetail onNavigate={handleNavigate} />} />
            <Route path="/incidents"      element={<Incidents onNavigate={handleNavigate} />} />
            <Route path="/incidents/*"    element={
              <IncidentDetail
                tab={incidentTab}
                onNavigate={handleNavigate}
                onTabChange={(t) => {
                  setIncidentTab(t);
                  navigate(`/incidents/${t}`);
                }}
              />
            } />
            <Route path="/cases"          element={<CaseMemory onNavigate={handleNavigate} />} />
            <Route path="/cases/detail"   element={<CaseDetail onNavigate={handleNavigate} />} />
            <Route path="/evaluation"     element={<Evaluation onNavigate={handleNavigate} />} />
            <Route path="/audit"          element={<AuditLog onNavigate={handleNavigate} />} />
            <Route path="/reports"        element={<Reports onNavigate={handleNavigate} />} />
            <Route path="/system"         element={<SystemHealth onNavigate={handleNavigate} />} />
            <Route path="/settings"       element={<SystemHealth onNavigate={handleNavigate} />} />
            <Route path="*"               element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ── Root with auth & marketing routing ── */
function AppRouter() {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      {/* Marketing Site - All 8 Public Navigation Routes */}
      <Route element={<MarketingLayout />}>
        {/* Redirect logged-in users from home to dashboard, or show marketing home */}
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Home />} />
        
        <Route path="/platform" element={<Platform />} />
        <Route path="/capabilities" element={<Platform />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/healthcare-security" element={<Solutions />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/security" element={<SecurityCompliance />} />
        <Route path="/compliance" element={<SecurityCompliance />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Auth Flows */}
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/forgot-password" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
      <Route path="/reset-password" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />
      <Route path="/accept-invitation" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <AcceptInvitation />} />
      <Route path="/verify-email" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <VerifyEmail />} />

      {/* Authenticated Application */}
      {/* 
        This wildcard captures all URLs not matched above. 
        If not logged in, it forces a redirect to /login.
        If logged in, it mounts AuthenticatedApp, which handles /dashboard, /incidents, etc.
      */}
      <Route path="/*" element={isLoggedIn ? <AuthenticatedApp /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

/* ── Root export ── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
```


################################################################################
### FILE 7/54: `src/api/apiService.ts`
################################################################################

```tsx
/**
 * MediSOC API Service Layer
 *
 * All data access goes through this file.
 * Currently backed by mock data from src/data/mock.ts
 *
 * INTEGRATION GUIDE (when backend arrives):
 * - Replace each function's mock return with a real fetch() call.
 * - The calling component code does NOT need to change.
 * - Set VITE_API_BASE in your .env file: VITE_API_BASE=http://localhost:8000
 * - The BASE_URL constant will pick it up automatically.
 */

import {
  trafficData,
  featureImportance,
  incidents as mockIncidents,
  devices as mockDevices,
  cases as mockCases,
  services as mockServices,
  detectionMetrics as mockDetectionMetrics,
  confusionMatrix as mockConfusionMatrix,
  modelComparison as mockModelComparison,
  safeReuseMetrics as mockSafeReuseMetrics,
  vectorMetrics as mockVectorMetrics,
} from "../data/mock";

/* ─── Config ────────────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const BASE_URL: string = (import.meta as any).env?.VITE_API_BASE ?? "";

/** Simulated network delay (ms) — remove when using real API */
const MOCK_DELAY = 400;

/* ─── Generic response wrapper ──────────────────────────────────────────────── */
export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

function ok<T>(data: T): ApiResult<T> {
  return { data, error: null, loading: false };
}

function err<T>(message: string): ApiResult<T> {
  return { data: null, error: message, loading: false };
}

async function delay(): Promise<void> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY));
}

/* ─── Domain types (extend / replace with real backend schema) ──────────────── */
export interface Incident {
  id: string;
  attack: string;
  type: string;
  target: string;
  criticality: string;
  confidence: number;
  route: string;
  outcome: string;
  time: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  criticality: string;
  ip: string;
  protocol: string;
  baseline: string;
  status: string;
}

export interface Case {
  id: string;
  attack: string;
  device: string;
  response: string;
  outcome: string;
  uses: number;
  reliability: number;
  similarity: number;
}

export interface ServiceStatus {
  name: string;
  status: string;
  detail: string;
  latency: string;
  impact: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorRole: string;
  target: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}

/* ─── Mock audit events ─────────────────────────────────────────────────────── */
const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  { id: "AUD-012", timestamp: "14:32:01", action: "INCIDENT_ACKNOWLEDGED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "INC-104", detail: "Incident acknowledged by Super Admin", severity: "info" },
  { id: "AUD-011", timestamp: "14:31:50", action: "RESPONSE_APPROVED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "INC-104", detail: "Response action approved: MQTT Rate Limiting", severity: "warning" },
  { id: "AUD-010", timestamp: "14:28:33", action: "CASE_REUSE_REJECTED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "CASE-017", detail: "Safe-reuse rejected — device context differs (Sensor→Gateway)", severity: "warning" },
  { id: "AUD-009", timestamp: "14:21:02", action: "INCIDENT_ACKNOWLEDGED", actor: "analyst@iomt-testbed.local", actorRole: "analyst", target: "INC-103", detail: "Incident acknowledged — UDP Flood suppressed at source", severity: "info" },
  { id: "AUD-008", timestamp: "14:18:44", action: "SIMULATION_STARTED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "SIM-RUN-0042", detail: "Attack simulation started: MQTT Connect Flood · Gateway-01", severity: "info" },
  { id: "AUD-007", timestamp: "13:57:12", action: "INCIDENT_ESCALATED", actor: "analyst@iomt-testbed.local", actorRole: "analyst", target: "INC-102", detail: "Incident escalated to Super Admin — partial outcome", severity: "warning" },
  { id: "AUD-006", timestamp: "13:44:05", action: "INCIDENT_ACKNOWLEDGED", actor: "analyst@iomt-testbed.local", actorRole: "analyst", target: "INC-101", detail: "Incident acknowledged — ICMP Flood resolved", severity: "info" },
  { id: "AUD-005", timestamp: "13:15:30", action: "DEVICE_ISOLATION_REQUESTED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "GW-01", detail: "Device isolation requested for Gateway-01 — awaiting approval", severity: "critical" },
  { id: "AUD-004", timestamp: "13:12:01", action: "RESPONSE_APPROVED", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "INC-100", detail: "Response action approved: Source Block + Rate Limit", severity: "warning" },
  { id: "AUD-003", timestamp: "12:55:44", action: "SYSTEM_LOGIN", actor: "analyst@iomt-testbed.local", actorRole: "analyst", target: "AUTH", detail: "User login — analyst@iomt-testbed.local", severity: "info" },
  { id: "AUD-002", timestamp: "12:55:10", action: "SYSTEM_LOGIN", actor: "admin@iomt-testbed.local", actorRole: "super_admin", target: "AUTH", detail: "User login — admin@iomt-testbed.local", severity: "info" },
  { id: "AUD-001", timestamp: "12:50:00", action: "SYSTEM_STARTUP", actor: "SYSTEM", actorRole: "system", target: "ALL", detail: "MediSOC system started — all services online", severity: "info" },
];

/* ─── Mock notification events ──────────────────────────────────────────────── */
export interface Notification {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  severity: "info" | "warning" | "critical";
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "N-003", title: "Critical Incident Active", detail: "INC-104 · DDoS MQTT Connect Flood on Gateway-01", time: "00:18 ago", read: false, severity: "critical" },
  { id: "N-002", title: "Detector Confidence Low", detail: "INC-102 confidence below 90% threshold", time: "35 min ago", read: false, severity: "warning" },
  { id: "N-001", title: "Case Memory Updated", detail: "CASE-128 marked as reliable · uses: 12", time: "1 hr ago", read: true, severity: "info" },
];

/* ─── API functions ─────────────────────────────────────────────────────────── */

/** Fetch all incidents (paginated) */
export async function getIncidents(filters?: {
  criticality?: string;
  outcome?: string;
  route?: string;
  search?: string;
}): Promise<ApiResult<{ items: Incident[]; total: number }>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/incidents?...`); */
  let items = [...mockIncidents];
  if (filters?.criticality && filters.criticality !== "All")
    items = items.filter((i) => i.criticality === filters.criticality);
  if (filters?.outcome && filters.outcome !== "All")
    items = items.filter((i) => i.outcome === filters.outcome);
  if (filters?.route && filters.route !== "All")
    items = items.filter((i) => i.route === filters.route);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.attack.toLowerCase().includes(q) ||
        i.target.toLowerCase().includes(q),
    );
  }
  return ok({ items, total: items.length });
}

/** Fetch single incident by ID */
export async function getIncident(id: string): Promise<ApiResult<Incident>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/incidents/${id}`); */
  const found = mockIncidents.find((i) => i.id === id);
  if (!found) return err(`Incident ${id} not found`);
  return ok(found);
}

/** Acknowledge an incident */
export async function acknowledgeIncident(
  id: string,
  note: string,
): Promise<ApiResult<{ success: boolean; auditId: string }>> {
  await delay();
  /* REPLACE WITH: POST /api/incidents/:id/acknowledge */
  console.info(`[MOCK] Acknowledged ${id}: ${note}`);
  return ok({ success: true, auditId: `AUD-${Date.now()}` });
}

/** Escalate an incident */
export async function escalateIncident(
  id: string,
  reason: string,
): Promise<ApiResult<{ success: boolean; auditId: string }>> {
  await delay();
  /* REPLACE WITH: POST /api/incidents/:id/escalate */
  console.info(`[MOCK] Escalated ${id}: ${reason}`);
  return ok({ success: true, auditId: `AUD-${Date.now()}` });
}

/** Submit an approved response action */
export async function submitResponse(
  incidentId: string,
  action: string,
  authorizedBy: string,
): Promise<ApiResult<{ success: boolean; auditId: string }>> {
  await delay();
  /* REPLACE WITH: POST /api/incidents/:id/response */
  console.info(`[MOCK] Response submitted for ${incidentId}: ${action} by ${authorizedBy}`);
  return ok({ success: true, auditId: `AUD-${Date.now()}` });
}

/** Fetch all devices */
export async function getDevices(filters?: {
  criticality?: string;
  status?: string;
}): Promise<ApiResult<Device[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/devices`); */
  let items = [...mockDevices];
  if (filters?.criticality && filters.criticality !== "All")
    items = items.filter((d) => d.criticality === filters.criticality);
  if (filters?.status && filters.status !== "All")
    items = items.filter((d) => d.status === filters.status);
  return ok(items);
}

/** Request device isolation (requires admin authorization) */
export async function requestDeviceIsolation(
  deviceId: string,
  requestedBy: string,
): Promise<ApiResult<{ success: boolean; auditId: string }>> {
  await delay();
  /* REPLACE WITH: POST /api/devices/:id/isolate */
  console.info(`[MOCK] Isolation requested for ${deviceId} by ${requestedBy}`);
  return ok({ success: true, auditId: `AUD-${Date.now()}` });
}

/** Fetch case memory */
export async function getCases(): Promise<ApiResult<Case[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/cases`); */
  return ok(mockCases);
}

/** Fetch system service health */
export async function getSystemHealth(): Promise<ApiResult<ServiceStatus[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/system/health`); */
  return ok(mockServices);
}

/** Fetch audit log */
export async function getAuditLog(filters?: {
  action?: string;
  actor?: string;
  severity?: string;
}): Promise<ApiResult<AuditEvent[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/audit`); */
  let items = [...MOCK_AUDIT_EVENTS];
  if (filters?.action && filters.action !== "All")
    items = items.filter((e) => e.action === filters.action);
  if (filters?.actor) items = items.filter((e) => e.actor.includes(filters.actor!));
  if (filters?.severity && filters.severity !== "All")
    items = items.filter((e) => e.severity === filters.severity);
  return ok(items);
}

/** Fetch notifications */
export async function getNotifications(): Promise<ApiResult<Notification[]>> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/notifications`); */
  return ok(MOCK_NOTIFICATIONS);
}

/** Fetch live traffic data */
export async function getTrafficData(): Promise<ApiResult<typeof trafficData>> {
  await delay();
  /* REPLACE WITH: WebSocket or polling /api/traffic/live */
  return ok(trafficData);
}

/** Fetch detection metrics */
export async function getDetectionMetrics(): Promise<
  ApiResult<{
    metrics: typeof mockDetectionMetrics;
    confusionMatrix: typeof mockConfusionMatrix;
    modelComparison: typeof mockModelComparison;
    featureImportance: typeof featureImportance;
    safeReuseMetrics: typeof mockSafeReuseMetrics;
    vectorMetrics: typeof mockVectorMetrics;
  }>
> {
  await delay();
  /* REPLACE WITH: const res = await fetch(`${BASE_URL}/api/evaluation/metrics`); */
  return ok({
    metrics: mockDetectionMetrics,
    confusionMatrix: mockConfusionMatrix,
    modelComparison: mockModelComparison,
    featureImportance,
    safeReuseMetrics: mockSafeReuseMetrics,
    vectorMetrics: mockVectorMetrics,
  });
}
```


################################################################################
### FILE 8/54: `src/auth/AuthContext.tsx`
################################################################################

```tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

/* ─── Role definitions ─────────────────────────────────────────────────────── */
export type UserRole = "super_admin" | "analyst" | "viewer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "medisoc_session";

/* ─── Mock credential store (replace with real API call when backend arrives) ─ */
const MOCK_USERS: Record<string, { password: string; user: Omit<AuthUser, "token"> }> = {
  "admin@iomt-testbed.local": {
    password: "admin123",
    user: { id: "usr-001", email: "admin@iomt-testbed.local", name: "Super Admin", role: "super_admin" },
  },
  "analyst@iomt-testbed.local": {
    password: "analyst123",
    user: { id: "usr-002", email: "analyst@iomt-testbed.local", name: "SOC Analyst", role: "analyst" },
  },
  "viewer@iomt-testbed.local": {
    password: "viewer123",
    user: { id: "usr-003", email: "viewer@iomt-testbed.local", name: "Read-Only Viewer", role: "viewer" },
  },
};

function generateMockToken(email: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `mock.${btoa(email).replace(/=/g, "")}.${ts}.${rand}`;
}

/* ─── Provider ─────────────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  // Keep sessionStorage in sync
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      /* ── MOCK IMPLEMENTATION ──────────────────────────────────────────────
         Replace this entire block with a real API call:
           const res = await fetch("/api/auth/login", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ email, password }),
           });
           if (!res.ok) return { success: false, error: "Invalid credentials" };
           const { token, user: userData } = await res.json();
           setUser({ ...userData, token });
           return { success: true };
      ─────────────────────────────────────────────────────────────────────── */
      await new Promise((r) => setTimeout(r, 600)); // simulate network delay
      const entry = MOCK_USERS[email.trim().toLowerCase()];
      if (!entry || entry.password !== password) {
        return { success: false, error: "Invalid email or password." };
      }
      const token = generateMockToken(email);
      const authedUser: AuthUser = { ...entry.user, token };
      setUser(authedUser);
      return { success: true };
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const changePassword = useCallback(
    async (currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
      await new Promise((r) => setTimeout(r, 600));
      if (!user) return { success: false, error: "Not authenticated" };
      const entry = MOCK_USERS[user.email.toLowerCase()];
      
      if (!entry || entry.password !== currentPass) {
        return { success: false, error: "Incorrect current password." };
      }
      if (currentPass === newPass) {
        return { success: false, error: "New password must be different." };
      }
      
      // Update in-memory mock credential
      entry.password = newPass;
      return { success: true };
    },
    [user]
  );

  const resetPassword = useCallback(
    async (newPass: string): Promise<{ success: boolean; error?: string }> => {
      await new Promise((r) => setTimeout(r, 600));
      // In a real system, this takes a reset token. 
      // For this mock, we will reset the admin password.
      const entry = MOCK_USERS["admin@iomt-testbed.local"];
      if (entry) {
        entry.password = newPass;
      }
      return { success: true };
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, changePassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Hook ─────────────────────────────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
```


################################################################################
### FILE 9/54: `src/components/ConfirmDialog.tsx`
################################################################################

```tsx
import React, { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "warning" | "danger" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional additional content rendered below description */
  children?: React.ReactNode;
}

const variantStyles = {
  warning: {
    icon: "#F59E0B",
    border: "#2A2010",
    bg: "#0F0D08",
    confirmBg: "#2A1E08",
    confirmBorder: "#3A2A10",
    confirmText: "#F59E0B",
    confirmHover: "#3A2A10",
  },
  danger: {
    icon: "#EF4444",
    border: "#2A1010",
    bg: "#0F0808",
    confirmBg: "#2A1010",
    confirmBorder: "#3A1818",
    confirmText: "#EF4444",
    confirmHover: "#3A1818",
  },
  info: {
    icon: "#94A8BA",
    border: "#1A1E1B",
    bg: "#0D100D",
    confirmBg: "#1A1E1B",
    confirmBorder: "#2A302B",
    confirmText: "#E8EDE9",
    confirmHover: "#2A302B",
  },
};

const icons = {
  warning: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 3L20 19H2L11 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 9v5M11 16v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  danger: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 7v5M11 14v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 10v5M11 8v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
  children,
}: Props) {
  const s = variantStyles[variant];
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open (safer default for destructive dialogs)
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-[440px] mx-4 rounded-[14px] shadow-2xl fade-in"
        style={{ background: s.bg, border: `1px solid ${s.border}` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div style={{ color: s.icon }} className="shrink-0 mt-0.5">{icons[variant]}</div>
          <div>
            <div
              id="confirm-dialog-title"
              className="text-[17px] font-semibold mb-1"
              style={{ color: "#E8EDE9" }}
            >
              {title}
            </div>
            <div className="text-[14px] leading-relaxed" style={{ color: "#94A8BA" }}>
              {description}
            </div>
          </div>
        </div>

        {/* Optional additional content */}
        {children && (
          <div className="px-6 pb-4" style={{ color: "#94A8BA" }}>
            {children}
          </div>
        )}

        {/* Actions */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: `1px solid ${s.border}` }}
        >
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 text-[14px] font-medium rounded-[8px] transition-colors"
            style={{
              background: "transparent",
              color: "#94A8BA",
              border: "1px solid #1A1E1B",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2A302B"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1A1E1B"; }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-[14px] font-semibold rounded-[8px] transition-colors mono"
            style={{
              background: s.confirmBg,
              color: s.confirmText,
              border: `1px solid ${s.confirmBorder}`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = s.confirmHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = s.confirmBg; }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 10/54: `src/components/Header.tsx`
################################################################################

```tsx
import React, { useState, useEffect } from "react";
import type { Screen } from "../types";
import { StatusDot } from "./ui/Badge";

const titles: Partial<Record<Screen, string>> = {
  dashboard: "Dashboard",
  "simulation-configure": "Attack Simulation",
  "simulation-running": "Attack Simulation",
  "simulation-result": "Attack Simulation",
  devices: "Devices",
  "device-detail": "Device Detail",
  incidents: "Incidents",
  "incident-overview": "Incident Detail",
  "incident-safereuse": "Incident Detail",
  "incident-response": "Incident Detail",
  "case-memory": "Case Memory",
  "case-detail": "Case Detail",
  evaluation: "Evaluation",
  "system-health": "System & Settings",
  settings: "System & Settings",
};

interface Props {
  screen: Screen;
}

export default function Header({ screen }: Props) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-[52px] min-h-[52px] bg-[#0F120F] border-b border-[#1A1F1B] flex items-center px-6 gap-4">
      <h1 className="font-semibold text-[20px] text-[#E8EDE9] flex-1">{titles[screen]}</h1>

      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#242924] text-[14px] mono text-[#94A8BA] uppercase tracking-widest bg-[#111511]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] inline-block" />
        Isolated IoMT Testbed
      </span>

      <div className="flex items-center gap-1.5">
        <StatusDot online={true} />
        <span className="text-[15px] text-[#94A8BA] mono">Systems OK</span>
      </div>

      <span className="text-[15px] mono text-[#94A8BA]">
        {time.toLocaleTimeString("en-GB")}
      </span>

      <div className="flex items-center gap-2 pl-3 border-l border-[#1A1F1B]">
        <div className="w-7 h-7 bg-[#B6FF3B] rounded-full flex items-center justify-center text-[14px] text-[#0C0F0D] font-bold">SA</div>
        <span className="text-[15px] font-medium text-[#E8EDE9]">Super Admin</span>
      </div>
    </header>
  );
}
```


################################################################################
### FILE 11/54: `src/components/Logo.tsx`
################################################################################

```tsx
import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "white" | "dark" | "auto";
  showText?: boolean;
  stacked?: boolean;
  clickable?: boolean;
  to?: string;
  className?: string;
}

export default function Logo({
  size = "md",
  variant = "white",
  showText = true,
  stacked = false,
  clickable = false,
  to = "/",
  className = "",
}: LogoProps) {
  // Height configurations
  const heightMap = {
    xs: "h-6",
    sm: "h-8",
    md: "h-9",
    lg: "h-12",
    xl: "h-16",
  };

  const currentHeight = heightMap[size] || heightMap.md;

  // Render the exact image asset provided by the user
  const content = stacked ? (
    <div className={`inline-flex flex-col items-center select-none group ${className}`}>
      <img
        src="/medisoc-logo.png"
        alt="MediSOC Official Logo"
        className={`${heightMap[size] === "h-16" ? "h-24" : heightMap[size] === "h-12" ? "h-16" : "h-12"} w-auto object-contain transition-transform duration-200 group-hover:scale-105`}
      />
    </div>
  ) : (
    <div className={`inline-flex items-center select-none group ${className}`}>
      <img
        src={variant === "dark" ? "/medisoc-logo.png" : "/medisoc-nav-logo.png"}
        alt="MediSOC"
        className={`${currentHeight} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
        onError={(e) => {
          // Fallback to medisoc-logo.png
          e.currentTarget.src = "/medisoc-logo.png";
        }}
      />
    </div>
  );

  if (clickable) {
    return (
      <Link
        to={to}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lime)] rounded-md transition-opacity hover:opacity-90 shrink-0"
      >
        {content}
      </Link>
    );
  }

  return content;
}


```


################################################################################
### FILE 12/54: `src/components/MockBanner.tsx`
################################################################################

```tsx
import React from "react";

interface Props {
  /** Override the default message */
  message?: string;
  /** Compact inline style vs full-width banner */
  compact?: boolean;
}

/**
 * MockBanner
 *
 * Displayed on every screen that shows data from the mock layer instead of
 * a live backend. Remove or hide this component once real API data is wired in.
 */
export default function MockBanner({ message, compact = false }: Props) {
  const text =
    message ??
    "MOCK DATA — All values shown are simulated. No live backend is connected.";

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] mono uppercase tracking-widest font-semibold"
        style={{ background: "#1A1A0A", color: "#8A8030", border: "1px solid #2A2A10" }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1" />
          <path d="M4 2.5v2M4 5.5v.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        MOCK
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 mb-4 rounded-[6px] text-[13px] mono"
      style={{ background: "#141408", color: "#8A8030", border: "1px solid #252510" }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.1" />
        <path d="M6.5 4v3.5M6.5 8.8v.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      <span>{text}</span>
    </div>
  );
}
```


################################################################################
### FILE 13/54: `src/components/Sidebar.tsx`
################################################################################

```tsx
import React from "react";
import { Link } from "react-router-dom";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import Logo from "./Logo";

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface NavItem {
  id: Screen;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
  badgeColor?: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  incidents: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13.5H1.5L8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="8" cy="11.5" r="0.6" fill="currentColor"/>
    </svg>
  ),
  devices: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="3.5" cy="8" r="0.8" fill="currentColor"/>
      <path d="M6 6.5h6M6 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  simulation: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5.5 5.5c.8-.5 4.5.5 5 3-1 2-4.5 2.5-5.5 1.5-.5-1 0-4 .5-4.5Z" stroke="currentColor" strokeWidth="1.1"/>
      <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
    </svg>
  ),
  cases: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2.5h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1Z" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 6h6M5 8.5h4M5 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  evaluation: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12L5.5 8 8.5 10.5 13 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 4h2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  reports: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1Z" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  audit: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L13.5 4.5v7L8 14.5 2.5 11.5v-7L8 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  system: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  chevronLeft: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronRight: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  medisoc: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L16 9L9 16L2 9L9 2Z" fill="#0A0C0A"/>
      <circle cx="9" cy="9" r="2.5" fill="#0A0C0A"/>
    </svg>
  ),
};

// ─── Nav sections ──────────────────────────────────────────────────────────────
const navSections: NavSection[] = [
  {
    title: "Operations",
    items: [
      { id: "dashboard",            label: "Overview",        icon: icons.dashboard },
      { id: "incidents",            label: "Incidents",       icon: icons.incidents },
      { id: "devices",              label: "Devices",         icon: icons.devices },
    ],
  },
  {
    title: "Investigation",
    items: [
      { id: "simulation-configure", label: "Attack Simulation", icon: icons.simulation, roles: ["super_admin", "analyst"] },
      { id: "case-memory",          label: "Case Memory",       icon: icons.cases },
      { id: "evaluation",           label: "Evaluation",        icon: icons.evaluation },
    ],
  },
  {
    title: "Management",
    items: [
      { id: "reports",              label: "Reports",         icon: icons.reports },
      { id: "audit-log",            label: "Audit Log",       icon: icons.audit, roles: ["super_admin"] },
      { id: "system-health",        label: "System",          icon: icons.system, roles: ["super_admin", "analyst"] },
    ],
  },
];

function matchActive(screen: Screen): Screen {
  if (screen.startsWith("simulation")) return "simulation-configure";
  if (screen === "device-detail")      return "devices";
  if (screen.startsWith("incident"))   return "incidents";
  if (screen === "case-detail")        return "case-memory";
  if (screen === "settings")           return "system-health";
  return screen;
}

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ screen, onNavigate, collapsed, onToggle }: Props) {
  const { user, logout } = useAuth();
  const role = user?.role ?? "viewer";
  const active = matchActive(screen);

  function roleBadge() {
    if (role === "super_admin") return { label: "Admin",   bg: "rgba(139,114,240,0.18)", color: "#8B72F0" };
    if (role === "analyst")     return { label: "Analyst", bg: "rgba(168,255,53,0.15)",  color: "#A8FF35" };
    return                             { label: "Viewer",  bg: "rgba(255,255,255,0.15)", color: "#FFFFFF" };
  }

  const rb = roleBadge();

  return (
    <aside
      className="h-full flex flex-col shrink-0 transition-all duration-200 overflow-hidden"
      style={{
        width: collapsed ? "64px" : "275px",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* ─── Brand header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between shrink-0 px-3 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <Logo size="sm" clickable to="/" />
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center">
            <Logo size="xs" showText={false} clickable to="/" />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center rounded-[5px] transition-colors shrink-0"
          style={{ color: "var(--text-4)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-3)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? icons.chevronRight : icons.chevronLeft}
        </button>
      </div>

      {/* ─── Demo data notice ─────────────────────────────────────────── */}
      {!collapsed && (
        <div
          className="mx-3 mt-2.5 px-2.5 py-1.5 rounded-[6px] flex items-center gap-1.5 text-[10px]"
          style={{ background: "rgba(139,114,240,0.08)", border: "1px solid rgba(139,114,240,0.18)", color: "#8B72F0", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1"/>
            <path d="M4.5 3v2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            <circle cx="4.5" cy="6.5" r="0.4" fill="currentColor"/>
          </svg>
          Demo Data
        </div>
      )}

      {/* ─── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 mt-1">
        {navSections.map((section, si) => {
          const visibleItems = section.items.filter(item =>
            !item.roles || item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={si} className="mb-4">
              {!collapsed && section.title && (
                <div
                  className="px-3 mb-1.5 text-[13px] font-bold uppercase tracking-[0.09em]"
                  style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}
                >
                  {section.title}
                </div>
              )}
              {collapsed && si > 0 && (
                <div className="h-px my-2 mx-1" style={{ background: "var(--border)" }} />
              )}

              {visibleItems.map(item => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all mb-1 border ${
                      isActive
                        ? "bg-[var(--surface-3)] border-[var(--border-2)] text-white shadow-sm"
                        : "border-transparent hover:bg-[var(--surface-2)] hover:text-white"
                    }`}
                    style={{ color: isActive ? "white" : "var(--text-2)", justifyContent: collapsed ? "center" : "flex-start" }}
                  >
                    <span
                      className="shrink-0 scale-110"
                      style={{ color: isActive ? "var(--lime)" : "currentColor" }}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-[17px] font-semibold truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className="ml-auto text-[13px] font-bold px-2 py-0.5 rounded-full mono"
                        style={{ background: item.badgeColor ?? "var(--surface-4)", color: "white" }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {/* Active indicator line */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                        style={{ background: "var(--lime)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ─── User profile footer ──────────────────────────────────────── */}
      <div
        className="shrink-0 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="p-3">
          <Link
            to="/"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14.5px] font-medium text-white hover:bg-white/[0.08] transition-colors mb-2.5"
            title="Return to Public Website"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {!collapsed && <span>Public Website</span>}
          </Link>

          {!collapsed ? (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold mono shrink-0"
                style={{ background: "var(--surface-4)", border: "1px solid var(--border-2)", color: "white" }}
              >
                {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold truncate text-white">
                  {user?.name ?? "Unknown"}
                </div>
                <div
                  className="text-[12px] px-2 py-0.5 rounded-[4px] inline-flex mt-0.5 font-bold mono uppercase"
                  style={{ background: rb.bg, color: rb.color, letterSpacing: "0.06em" }}
                >
                  {rb.label}
                </div>
              </div>
              <button
                onClick={logout}
                className="shrink-0 text-[13px] mono transition-colors p-1"
                style={{ color: "var(--text-3)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
                title="Sign out"
                id="sign-out-btn"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 4.5L12.5 7l-3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.5 7H6M6 3H4a1 1 0 00-1 1v6a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mono"
                style={{ background: "var(--surface-4)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}
                title={user?.name}
              >
                {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
              <button
                onClick={logout}
                className="transition-colors"
                style={{ color: "var(--text-4)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
                title="Sign out"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 4.5L12.5 7l-3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.5 7H6M6 3H4a1 1 0 00-1 1v6a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
```


################################################################################
### FILE 14/54: `src/components/TopBar.tsx`
################################################################################

```tsx
import React, { useState, useEffect, useRef } from "react";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import type { Notification } from "../api/apiService";
import { getNotifications } from "../api/apiService";

const PAGE_LABELS: Partial<Record<Screen, string>> = {
  "dashboard":            "Security Overview",
  "incidents":            "Incident Management",
  "incident-overview":    "Incident Investigation",
  "incident-safereuse":   "Safe Reuse Analysis",
  "incident-response":    "Response & Outcome",
  "devices":              "Device Inventory",
  "device-detail":        "Device Details",
  "simulation-configure": "Attack Simulation",
  "simulation-running":   "Attack Simulation · Running",
  "simulation-result":    "Attack Simulation · Results",
  "case-memory":          "Case Memory",
  "case-detail":          "Case Detail",
  "evaluation":           "Evaluation & Metrics",
  "audit-log":            "Audit Log",
  "reports":              "Reports & Export",
  "system-health":        "System Health",
  "settings":             "Settings",
};

function severityColor(s: Notification["severity"]) {
  if (s === "critical") return "var(--critical)";
  if (s === "warning")  return "var(--warning)";
  return "var(--success)";
}

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onToggleSidebar: () => void;
}

export default function TopBar({ screen, onNavigate, onToggleSidebar }: Props) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getNotifications().then(r => { if (r.data) setNotifications(r.data); });
  }, []);

  // Close bell on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;
  const pageLabel = PAGE_LABELS[screen] ?? "MediSOC";

  return (
    <header
      className="w-full h-[58px] min-h-[58px] flex items-center px-6 gap-4 z-40 shrink-0"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1
          className="text-[20px] font-bold truncate text-white"
        >
          {pageLabel}
        </h1>
      </div>

      {/* Right-side controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick link to public website */}
        <a
          href="/"
          className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[14px] font-mono text-white hover:bg-white/[0.08] transition-colors"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          title="Switch to Public Website"
        >
          <span>Public Website</span>
          <span className="text-[var(--lime)] font-bold">↗</span>
        </a>

        {/* System status indicator */}
        <div
          className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-mono text-white font-bold"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <span className="w-2 h-2 rounded-full inline-block lime-pulse" style={{ background: "var(--lime)" }} />
          <span style={{ textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Online
          </span>
        </div>

        {/* Clock */}
        <div
          className="hidden xl:block text-[14px] mono px-3.5 py-1.5 rounded-lg font-semibold text-white"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}
        >
          {time.toLocaleTimeString("en-GB")}
        </div>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            id="notification-bell"
            onClick={() => setBellOpen(o => !o)}
            className="relative w-8 h-8 flex items-center justify-center rounded-[7px] transition-colors"
            style={{
              background: bellOpen ? "var(--surface-3)" : "transparent",
              border: `1px solid ${bellOpen ? "var(--border-2)" : "transparent"}`,
              color: bellOpen ? "var(--text)" : "var(--text-3)",
            }}
            onMouseEnter={e => {
              if (!bellOpen) e.currentTarget.style.background = "var(--surface-2)";
            }}
            onMouseLeave={e => {
              if (!bellOpen) e.currentTarget.style.background = "transparent";
            }}
            aria-label="Notifications"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1.5a5 5 0 00-5 5v3.5l-1 1.5h12l-1-1.5V6.5a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M6 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center mono"
                style={{ background: "var(--critical)", color: "white" }}
              >
                {unread}
              </span>
            )}
          </button>

          {/* Notification panel */}
          {bellOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-[340px] rounded-[10px] shadow-2xl z-50 overflow-hidden fade-in"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}
            >
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                  Notifications
                </span>
                <span className="text-[11px] mono" style={{ color: "var(--text-3)" }}>
                  {unread} unread
                </span>
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--text-3)" }}>
                  No notifications
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0"
                    style={{
                      borderColor: "var(--border)",
                      background: n.read ? "transparent" : "rgba(168,255,53,0.03)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-3)")}
                    onMouseLeave={e => (e.currentTarget.style.background = n.read ? "transparent" : "rgba(168,255,53,0.03)")}
                    onClick={() => setBellOpen(false)}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                      style={{ background: severityColor(n.severity) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
                        {n.title}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
                        {n.detail}
                      </div>
                    </div>
                    <span className="text-[11px] mono shrink-0 mt-0.5" style={{ color: "var(--text-3)" }}>
                      {n.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Active incident quick indicator */}
        <button
          onClick={() => onNavigate("incident-overview")}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-[11px] mono font-semibold uppercase tracking-widest transition-colors"
          style={{
            background: "rgba(245,56,56,0.1)",
            border: "1px solid rgba(245,56,56,0.25)",
            color: "var(--critical)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,56,56,0.15)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(245,56,56,0.1)")}
          title="Active critical incident"
        >
          <span className="w-1.5 h-1.5 rounded-full pulse-critical" style={{ background: "var(--critical)" }} />
          INC-104
        </button>
      </div>
    </header>
  );
}
```


################################################################################
### FILE 15/54: `src/components/TopNav.tsx`
################################################################################

```tsx
import React, { useState, useEffect, useRef } from "react";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import type { Notification } from "../api/apiService";
import { getNotifications } from "../api/apiService";
import Logo from "./Logo";

interface NavGroup { id: Screen; label: string; roles?: string[]; }

const navGroups: NavGroup[] = [
  { id: "dashboard",             label: "Dashboard" },
  { id: "simulation-configure",  label: "Attack Simulation" },
  { id: "devices",               label: "Devices" },
  { id: "incidents",             label: "Incidents" },
  { id: "case-memory",           label: "Case Memory" },
  { id: "evaluation",            label: "Evaluation" },
  { id: "system-health",         label: "System & Settings", roles: ["super_admin", "analyst"] },
  { id: "audit-log",             label: "Audit Log",         roles: ["super_admin"] },
];

function matchGroup(screen: Screen): Screen {
  if (screen.startsWith("simulation")) return "simulation-configure";
  if (screen === "device-detail")      return "devices";
  if (screen.startsWith("incident"))   return "incidents";
  if (screen === "case-detail")        return "case-memory";
  if (screen === "settings")           return "system-health";
  return screen;
}

function roleBadgeStyle(role: string): { bg: string; color: string } {
  if (role === "super_admin") return { bg: "#1E1A3D", color: "#A78BFA" };
  if (role === "analyst")     return { bg: "#0D1410", color: "#4ADE80" };
  return                             { bg: "#111511", color: "#94A8BA" };
}
function roleLabel(role: string): string {
  if (role === "super_admin") return "Super Admin";
  if (role === "analyst")     return "Analyst";
  return "Viewer";
}

interface Props {
  screen: Screen;
  onNavigate: (s: Screen) => void;
}

export default function TopNav({ screen, onNavigate }: Props) {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getNotifications().then((r) => { if (r.data) setNotifications(r.data); });
  }, []);

  // Close bell on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = matchGroup(screen);
  const unread = notifications.filter((n) => !n.read).length;
  const role   = user?.role ?? "viewer";

  // Filter nav by role
  const visibleNav = navGroups.filter((g) => !g.roles || g.roles.includes(role));

  function severityDot(s: Notification["severity"]) {
    if (s === "critical") return "#EF4444";
    if (s === "warning")  return "#D97706";
    return "#16A34A";
  }

  return (
    <nav className="w-full h-[64px] min-h-[64px] bg-[#080B08] border-b border-[#1C272D] flex items-center px-6 gap-0 z-50 relative">
      {/* Wordmark & Brand Logo */}
      <div className="flex items-center mr-8 shrink-0">
        <Logo size="sm" variant="white" clickable to="/" />
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
        {visibleNav.map((g) => {
          const isActive = active === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onNavigate(g.id as Screen)}
              className={`relative px-4 py-2 text-[18px] font-semibold whitespace-nowrap rounded-[7px] transition-colors ${
                isActive ? "bg-[#1A2124] text-white" : "text-white/80 hover:text-white hover:bg-[#111619]"
              }`}
            >
              {g.label}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-[#B6FF3B] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 shrink-0 pl-5 border-l border-[#1C272D]">

        {/* System status dot */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] inline-block lime-pulse" />
          <span className="text-[15px] font-semibold mono text-white hidden xl:inline">ONLINE</span>
        </div>

        {/* Clock */}
        <span className="text-[16px] mono text-white/90 hidden lg:inline font-medium">
          {time.toLocaleTimeString("en-GB")}
        </span>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            id="notification-bell"
            onClick={() => setBellOpen((o) => !o)}
            className="relative w-9 h-9 flex items-center justify-center rounded-[8px] transition-colors hover:bg-[#1A2124] text-white"
            aria-label="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1.5a5 5 0 00-5 5v3.5l-1 1.5h12l-1-1.5V6.5a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M6 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EF4444] rounded-full text-[11px] font-bold text-white flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {bellOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-[380px] rounded-[12px] shadow-2xl z-50 overflow-hidden fade-in"
              style={{ background: "#0D1112", border: "1px solid #243038" }}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#243038" }}>
                <span className="text-[16px] font-bold text-white">Notifications</span>
                <span className="text-[14px] mono font-semibold text-white/80">{unread} unread</span>
              </div>
              {notifications.length === 0 ? (
                <div className="px-5 py-10 text-center text-[16px] text-white/70">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3.5 px-5 py-3.5 border-b cursor-pointer transition-colors hover:bg-[#151B1E]"
                    style={{
                      borderColor: "#1C272D",
                      background: n.read ? "transparent" : "#111619",
                    }}
                    onClick={() => setBellOpen(false)}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: severityDot(n.severity) }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-white">{n.title}</div>
                      <div className="text-[14px] mt-0.5 text-slate-300">{n.detail}</div>
                    </div>
                    <span className="text-[13px] mono shrink-0 mt-0.5 text-white/70">{n.time}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Role badge + user info */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-[6px] text-[13px] mono font-bold uppercase tracking-wider"
            style={roleBadgeStyle(role)}
          >
            {roleLabel(role)}
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold mono"
            style={{ background: "#151B1E", border: "1px solid #2E3D48", color: "#FFFFFF" }}
            title={user?.email}
          >
            {user?.name?.slice(0, 2).toUpperCase() ?? "SA"}
          </div>
          <button
            id="sign-out-btn"
            onClick={logout}
            className="text-[15px] mono font-medium text-white transition-colors hover:text-[#EF4444]"
          >
            Sign out
          </button>
        </div>

      </div>
    </nav>
  );
}
```


################################################################################
### FILE 16/54: `src/components/ui/Badge.tsx`
################################################################################

```tsx
import React from "react";

type Variant = "default" | "success" | "danger" | "warning" | "violet" | "lime" | "dark" | "outline";

const variants: Record<Variant, string> = {
  default: "bg-[#1A1F1B] text-[#E8EDE9] border border-[#2A302B]",
  success: "bg-[#14291A] text-[#4ADE80] border border-[#1A3D22]",
  danger: "bg-[#2C1010] text-[#F87171] border border-[#3D1A1A]",
  warning: "bg-[#2C1E06] text-[#FBBF24] border border-[#3D2A0A]",
  violet: "bg-[#1E1A3D] text-[#A78BFA] border border-[#2A2450]",
  lime: "bg-[#B6FF3B] text-[#0C0F0D] border border-[#9EDE2E]",
  dark: "bg-[#E8EDE9] text-[#0C0F0D] border border-[#C0C8C1]",
  outline: "bg-transparent text-[#94A8BA] border border-[#2A302B]",
};

interface Props {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export default function Badge({ variant = "default", children, className = "", size = "sm" }: Props) {
  const sz = size === "sm" ? "px-2 py-0.5 text-[14px]" : "px-3 py-1 text-[15px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium mono uppercase tracking-wide whitespace-nowrap ${sz} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function CriticalityBadge({ value }: { value: string }) {
  const map: Record<string, "danger" | "warning" | "violet" | "outline"> = {
    Critical: "danger", High: "warning", Medium: "violet", Low: "outline",
  };
  return <Badge variant={map[value] || "default"}>{value}</Badge>;
}

export function RouteBadge({ value }: { value: string }) {
  const map: Record<string, "lime" | "warning" | "dark"> = {
    SHORT: "lime", PARTIAL: "warning", DEEP: "dark",
  };
  return <Badge variant={map[value] || "default"}>{value}</Badge>;
}

export function OutcomeBadge({ value }: { value: string }) {
  const map: Record<string, "success" | "warning" | "danger"> = {
    SUCCESS: "success", PARTIAL: "warning", FAILURE: "danger", HARMFUL: "danger",
  };
  return <Badge variant={map[value] || "default"}>{value}</Badge>;
}

export function StatusDot({ online }: { online: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${online ? "bg-[#22C55E] lime-pulse" : "bg-[#EF4444]"}`} />
  );
}
```


################################################################################
### FILE 17/54: `src/components/ui/Button.tsx`
################################################################################

```tsx
import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "dark";

const base = "inline-flex items-center gap-2 rounded-[10px] font-semibold text-[19px] transition-all duration-150 cursor-pointer select-none focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-[#B6FF3B] text-[#0C0F0D] hover:bg-[#CAFF6A] active:scale-[0.98] px-4 py-2",
  secondary: "bg-[#1A1F1B] text-[#E8EDE9] border border-[#2A302B] hover:border-[#B6FF3B] hover:bg-[#1E241F] active:scale-[0.98] px-4 py-2",
  danger: "bg-[#EF4444] text-white hover:bg-[#DC2626] active:scale-[0.98] px-4 py-2",
  ghost: "bg-transparent text-[#94A8BA] hover:text-[#E8EDE9] hover:bg-[#1A1F1B] px-3 py-2",
  dark: "bg-[#E8EDE9] text-[#0C0F0D] hover:bg-white active:scale-[0.98] px-4 py-2",
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
}

export default function Button({ variant = "primary", children, className = "", ...props }: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
```


################################################################################
### FILE 18/54: `src/components/ui/Card.tsx`
################################################################################

```tsx
import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className = "", dark = false, onClick, hover = false }: Props) {
  const base = dark
    ? "bg-[#0A0D0A] border border-[#1A1F1B] text-[#E8EDE9]"
    : "bg-[#111511] border border-[#242924] text-[#E8EDE9]";
  const hov = hover
    ? "cursor-pointer transition-all duration-150 hover:border-[#2A302B] hover:bg-[#141814]"
    : "";
  return (
    <div
      className={`rounded-[12px] ${base} ${hov} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```


################################################################################
### FILE 19/54: `src/data/mock.ts`
################################################################################

```tsx
/**
 * MediSOC Mock Data
 * Comprehensive demonstration data for the healthcare cybersecurity SOC platform.
 * All data is clearly labeled as DEMONSTRATION DATA — not from a live hospital environment.
 */

export const trafficData = Array.from({ length: 60 }, (_, i) => {
  const t = i;
  const isAttack = i >= 15 && i <= 50;
  const isContained = i >= 38;
  const legitBase = 25 + Math.sin(i * 0.3) * 3 + Math.random() * 2;
  const malicious = isAttack
    ? isContained
      ? Math.max(2, 80 - (i - 38) * 4 + Math.random() * 5)
      : 60 + Math.random() * 30
    : 0;
  const legit = isAttack
    ? isContained
      ? legitBase * 0.9
      : legitBase * (1 - Math.min(0.7, (malicious / 100) * 0.6))
    : legitBase;
  return { t, legit: +legit.toFixed(1), malicious: +malicious.toFixed(1) };
});

// 7-day alert trend data
export const alertTrendData = [
  { day: "Mon", critical: 2, high: 5, medium: 8, low: 12 },
  { day: "Tue", critical: 1, high: 3, medium: 11, low: 9 },
  { day: "Wed", critical: 3, high: 7, medium: 6, low: 14 },
  { day: "Thu", critical: 0, high: 4, medium: 9, low: 11 },
  { day: "Fri", critical: 4, high: 8, medium: 7, low: 8 },
  { day: "Sat", critical: 1, high: 2, medium: 5, low: 6 },
  { day: "Sun", critical: 2, high: 6, medium: 10, low: 7 },
];

// Attack type breakdown for donut / bar chart
export const attackTypeData = [
  { type: "MQTT Flood", count: 4, pct: 38 },
  { type: "UDP Flood",  count: 3, pct: 28 },
  { type: "SYN Flood",  count: 2, pct: 19 },
  { type: "TCP Flood",  count: 1, pct: 9  },
  { type: "ICMP Flood", count: 1, pct: 6  },
];

export const featureImportance = [
  { name: "Connection Rate", value: 0.34 },
  { name: "Packets/sec",     value: 0.27 },
  { name: "Bytes/sec",       value: 0.19 },
  { name: "Flow Duration",   value: 0.12 },
  { name: "SYN Count",       value: 0.08 },
];

export const incidents = [
  {
    id: "INC-104",
    attack: "MQTT Connect Flood",
    type: "DDoS",
    target: "Gateway-01",
    targetId: "GW-01",
    criticality: "Critical",
    status: "Investigating",
    confidence: 97,
    route: "PARTIAL",
    outcome: "SUCCESS",
    time: "14:32",
    assignee: "admin@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "192.168.50.22",
    protocol: "MQTT",
    packetsPerSec: 4218,
    description: "High-volume MQTT CONNECT packet flood targeting the patient monitor gateway. Source identified as internal subnet 192.168.50.x. Detector confidence above threshold.",
  },
  {
    id: "INC-103",
    attack: "UDP Flood",
    type: "DoS",
    target: "Sensor-02",
    targetId: "SN-02",
    criticality: "Low",
    status: "Resolved",
    confidence: 94,
    route: "SHORT",
    outcome: "SUCCESS",
    time: "14:21",
    assignee: "analyst@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "10.0.0.55",
    protocol: "UDP",
    packetsPerSec: 1820,
    description: "UDP packet flood on Sensor-02. Short investigation route used — signature matches known pattern. Contained at source.",
  },
  {
    id: "INC-102",
    attack: "SYN Flood",
    type: "DDoS",
    target: "Gateway-01",
    targetId: "GW-01",
    criticality: "Critical",
    status: "Escalated",
    confidence: 89,
    route: "DEEP",
    outcome: "PARTIAL",
    time: "13:57",
    assignee: "admin@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "Multiple",
    protocol: "TCP",
    packetsPerSec: 3105,
    description: "Multi-source SYN flood on Gateway-01. Detector confidence below 90% threshold — deep investigation route triggered. Escalated to Super Admin.",
  },
  {
    id: "INC-101",
    attack: "ICMP Flood",
    type: "DoS",
    target: "Sensor-01",
    targetId: "SN-01",
    criticality: "Medium",
    status: "Resolved",
    confidence: 91,
    route: "SHORT",
    outcome: "SUCCESS",
    time: "13:44",
    assignee: "analyst@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "10.0.0.88",
    protocol: "ICMP",
    packetsPerSec: 850,
    description: "ICMP echo-request flood on Sensor-01. Resolved via source block. Sensor availability maintained throughout.",
  },
  {
    id: "INC-100",
    attack: "TCP Flood",
    type: "DDoS",
    target: "Broker-01",
    targetId: "BR-01",
    criticality: "High",
    status: "Resolved",
    confidence: 88,
    route: "PARTIAL",
    outcome: "PARTIAL",
    time: "13:12",
    assignee: "admin@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "Multiple",
    protocol: "TCP",
    packetsPerSec: 2440,
    description: "Multi-source TCP flood targeting MQTT Broker. Partial containment achieved — rate limiting applied. Service degraded for approximately 40 seconds.",
  },
  {
    id: "INC-099",
    attack: "MQTT Publish Flood",
    type: "DDoS",
    target: "Gateway-01",
    targetId: "GW-01",
    criticality: "Critical",
    status: "Resolved",
    confidence: 95,
    route: "DEEP",
    outcome: "SUCCESS",
    time: "12:55",
    assignee: "admin@iomt-testbed.local",
    detectedBy: "XGBoost-v3",
    sourceIp: "192.168.50.11",
    protocol: "MQTT",
    packetsPerSec: 3880,
    description: "MQTT PUBLISH packet flood on Gateway-01. Full investigation completed — case stored in memory for future reuse.",
  },
];

export const devices = [
  {
    id: "GW-01",
    name: "Gateway-01",
    type: "Patient Monitor Gateway",
    category: "Gateway",
    manufacturer: "MedConnect Inc.",
    model: "MCG-4000",
    criticality: "Critical",
    clinicalRole: "Primary gateway for ICU patient monitor telemetry",
    ip: "10.0.0.10",
    macAddress: "AA:BB:CC:DD:EE:01",
    protocol: "MQTT",
    baseline: "20–30 msg/s",
    status: "Online",
    monitoringStatus: "Active",
    riskScore: 82,
    vulnerabilities: 2,
    firmwareVersion: "4.2.1",
    lastSeen: "Just now",
    networkZone: "Clinical IoMT",
    incidentCount: 3,
    notes: "[DEMO] Fictional device for demonstration purposes.",
  },
  {
    id: "BR-01",
    name: "Broker-01",
    type: "MQTT Broker",
    category: "Broker",
    manufacturer: "Eclipse Foundation",
    model: "Mosquitto 2.0",
    criticality: "High",
    clinicalRole: "Central MQTT message broker for all IoMT communications",
    ip: "10.0.0.5",
    macAddress: "AA:BB:CC:DD:EE:02",
    protocol: "MQTT",
    baseline: "60–80 msg/s",
    status: "Online",
    monitoringStatus: "Active",
    riskScore: 55,
    vulnerabilities: 1,
    firmwareVersion: "2.0.15",
    lastSeen: "Just now",
    networkZone: "Infrastructure",
    incidentCount: 1,
    notes: "[DEMO] Fictional device for demonstration purposes.",
  },
  {
    id: "SN-01",
    name: "Sensor-01",
    type: "Medical Sensor",
    category: "Sensor",
    manufacturer: "BioSense Labs",
    model: "BSL-S200",
    criticality: "Medium",
    clinicalRole: "Vital signs sensor — Ward A, Beds 1-8",
    ip: "10.0.0.21",
    macAddress: "AA:BB:CC:DD:EE:03",
    protocol: "MQTT",
    baseline: "8–12 msg/s",
    status: "Online",
    monitoringStatus: "Active",
    riskScore: 31,
    vulnerabilities: 0,
    firmwareVersion: "3.1.0",
    lastSeen: "2 min ago",
    networkZone: "Clinical IoMT",
    incidentCount: 1,
    notes: "[DEMO] Fictional device for demonstration purposes.",
  },
  {
    id: "SN-02",
    name: "Sensor-02",
    type: "Medical Sensor",
    category: "Sensor",
    manufacturer: "BioSense Labs",
    model: "BSL-S200",
    criticality: "Low",
    clinicalRole: "Vital signs sensor — Ward B, Beds 1-6",
    ip: "10.0.0.22",
    macAddress: "AA:BB:CC:DD:EE:04",
    protocol: "MQTT",
    baseline: "6–10 msg/s",
    status: "Online",
    monitoringStatus: "Active",
    riskScore: 18,
    vulnerabilities: 0,
    firmwareVersion: "3.1.0",
    lastSeen: "3 min ago",
    networkZone: "Clinical IoMT",
    incidentCount: 1,
    notes: "[DEMO] Fictional device for demonstration purposes.",
  },
];

export const cases = [
  { id: "CASE-128", attack: "MQTT Flood", device: "Gateway — Critical", response: "Rate Limiting + Source Block", outcome: "SUCCESS", uses: 12, reliability: 84, similarity: 89 },
  { id: "CASE-117", attack: "UDP Flood",  device: "Sensor — Medium",   response: "Source Block",                outcome: "SUCCESS", uses: 8,  reliability: 91, similarity: 77 },
  { id: "CASE-099", attack: "SYN Flood",  device: "Gateway — Critical", response: "Rate Limiting",              outcome: "PARTIAL", uses: 5,  reliability: 72, similarity: 65 },
  { id: "CASE-087", attack: "TCP Flood",  device: "Broker — High",      response: "Source Block + Rate Limit",  outcome: "SUCCESS", uses: 14, reliability: 88, similarity: 82 },
  { id: "CASE-073", attack: "ICMP Flood", device: "Sensor — Low",       response: "Source Block",               outcome: "SUCCESS", uses: 6,  reliability: 93, similarity: 71 },
  { id: "CASE-017", attack: "MQTT Connect Flood", device: "Sensor — Medium", response: "Rate Limiting",         outcome: "SUCCESS", uses: 12, reliability: 89, similarity: 82 },
];

export const services = [
  { name: "Edge Gateway",  status: "Online", detail: "v2.4.1",          latency: "3ms",  impact: "Primary network entry point" },
  { name: "Detector",      status: "Online", detail: "XGBoost-v3",      latency: "12ms", impact: "Required for incident detection" },
  { name: "Controller",    status: "Online", detail: "v1.8.0",          latency: "5ms",  impact: "Routes response decisions" },
  { name: "Case Memory",   status: "Online", detail: "ChromaDB v0.4",   latency: "8ms",  impact: "Historical case retrieval" },
  { name: "MQTT Broker",   status: "Online", detail: "Mosquitto 2.0",   latency: "1ms",  impact: "IoMT message transport" },
  { name: "Database",      status: "Online", detail: "PostgreSQL 15",   latency: "4ms",  impact: "Persistent incident storage" },
];

export const detectionMetrics = {
  precision: 0.963,
  recall: 0.951,
  f1: 0.957,
  fpr: 0.021,
};

export const confusionMatrix = [
  { label: "TP", value: 284 }, { label: "FP", value: 11  },
  { label: "FN", value: 14  }, { label: "TN", value: 512 },
];

export const modelComparison = [
  { model: "Random Forest", precision: 0.934, recall: 0.921, f1: 0.927, latency: 18 },
  { model: "XGBoost",       precision: 0.963, recall: 0.951, f1: 0.957, latency: 12 },
  { model: "LightGBM",      precision: 0.948, recall: 0.939, f1: 0.943, latency: 9  },
];

export const safeReuseMetrics = [
  { metric: "Safe-Reuse Precision",   fullInv: "N/A",  simOnly: "0.71", simOutcome: "0.79", proposed: "0.88" },
  { metric: "Wrong-Reuse Rate",       fullInv: "0.00", simOnly: "0.18", simOutcome: "0.12", proposed: "0.06" },
  { metric: "Investigation Steps",    fullInv: "4.0",  simOnly: "1.2",  simOutcome: "1.8",  proposed: "1.4"  },
  { metric: "Median TTC (s)",         fullInv: "38",   simOnly: "11",   simOutcome: "16",   proposed: "14"   },
  { metric: "Harmful Response Rate",  fullInv: "0.00", simOnly: "0.09", simOutcome: "0.04", proposed: "0.02" },
];

export const vectorMetrics = [
  { attack: "SYN Flood",      suppression: 94, availability: 91, ttc: 12, recovery: 18 },
  { attack: "TCP Flood",      suppression: 88, availability: 87, ttc: 15, recovery: 22 },
  { attack: "UDP Flood",      suppression: 92, availability: 90, ttc: 11, recovery: 17 },
  { attack: "ICMP Flood",     suppression: 96, availability: 93, ttc: 9,  recovery: 14 },
  { attack: "MQTT Connect",   suppression: 90, availability: 88, ttc: 14, recovery: 20 },
  { attack: "MQTT Publish",   suppression: 87, availability: 85, ttc: 16, recovery: 24 },
];
```


################################################################################
### FILE 20/54: `src/index.css`
################################################################################

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
@import 'tailwindcss';

html, body, #root {
  height: 100%;
}

/* ═══════════════════════════════════════════════════════════════════
   MediSOC Design System — Professional Healthcare Cybersecurity SOC
   ═══════════════════════════════════════════════════════════════════ */

:root {
  /* Core background hierarchy */
  --bg:        #070909;
  --bg-alt:    #090C0C;
  --surface:   #0D1112;
  --surface-2: #111619;
  --surface-3: #151B1E;
  --surface-4: #1A2124;
  --surface-5: #1E262A;

  /* Text hierarchy — updated: #4A6170 replaced with pure white #FFFFFF */
  --text:      #FFFFFF;
  --text-2:    #E2E8F0;
  --text-3:    #FFFFFF; /* Replaced #4A6170 / #496170 with pure white */
  --text-4:    #CBD5E1; /* High-contrast readable light slate */

  /* Borders */
  --border:    #1C272D;
  --border-2:  #243038;
  --border-3:  #2E3D48;

  /* Brand accent — MediSOC Lime (retained from original) */
  --lime:      #A8FF35;
  --lime-dim:  #86D020;
  --lime-glow: rgba(168,255,53,0.12);

  /* Severity palette — clinical-grade clarity */
  --critical:      #F53838;
  --critical-bg:   #1A0707;
  --critical-dim:  #7A1010;
  --high:          #E8650C;
  --high-bg:       #180B02;
  --high-dim:      #7A3008;
  --medium:        #E8C20C;
  --medium-bg:     #181200;
  --medium-dim:    #7A6008;
  --low:           #0CB86B;
  --low-bg:        #021410;
  --low-dim:       #08603A;
  --info:          #0C9AE8;
  --info-bg:       #020F1A;
  --info-dim:      #085A8A;

  /* Status */
  --success:    #1CC970;
  --warning:    #F0A020;
  --danger:     #F53838;

  /* Purple/violet for AI/ML indicators */
  --violet:     #8B72F0;
  --violet-dim: #4A2E8A;
  --violet-bg:  #0E0B1A;

  /* Chart colors */
  --chart-1:   #A8FF35;
  --chart-2:   #F53838;
  --chart-3:   #0C9AE8;
  --chart-4:   #E8C20C;
  --chart-5:   #8B72F0;

  /* Radius */
  --radius-sm:  4px;
  --radius:     8px;
  --radius-md:  10px;
  --radius-lg:  14px;
  --radius-xl:  18px;

  /* Shadows */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.5);
  --shadow:     0 4px 12px rgba(0,0,0,0.6);
  --shadow-lg:  0 8px 30px rgba(0,0,0,0.7);
  --shadow-xl:  0 16px 60px rgba(0,0,0,0.8);
}

/* ═══ Reset & Base ══════════════════════════════════════════════════ */
* {
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: #1C272D transparent;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', 'Space Grotesk', system-ui, sans-serif;
  font-size: 18px; /* Scaled 30% from 14px */
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.mono {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}

/* ═══ Scrollbar ══════════════════════════════════════════════════════ */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #1C272D;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #2E3D48;
}

/* ═══ Chart grid ══════════════════════════════════════════════════════ */
.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line {
  stroke: #1C272D;
}

/* ═══ Severity badge system ══════════════════════════════════════════ */
.sev-critical { background: var(--critical-bg); color: var(--critical); border-color: var(--critical-dim); }
.sev-high     { background: var(--high-bg);     color: var(--high);     border-color: var(--high-dim); }
.sev-medium   { background: var(--medium-bg);   color: var(--medium);   border-color: var(--medium-dim); }
.sev-low      { background: var(--low-bg);      color: var(--low);      border-color: var(--low-dim); }
.sev-info     { background: var(--info-bg);     color: var(--info);     border-color: var(--info-dim); }

/* ═══ Status pill ═════════════════════════════════════════════════════ */
.status-online    { color: var(--success); }
.status-offline   { color: var(--danger); }
.status-degraded  { color: var(--warning); }

/* ═══ Animations ══════════════════════════════════════════════════════ */
.fade-in {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.pulse-critical {
  animation: pulseCritical 2s ease-in-out infinite;
}

@keyframes pulseCritical {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(245,56,56,0.4); }
  50%       { opacity: 0.8; box-shadow: 0 0 0 6px rgba(245,56,56,0); }
}

.lime-pulse {
  animation: limePulse 2s ease-in-out infinite;
}

@keyframes limePulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.lime-ring {
  animation: limeRing 2.5s ease-in-out infinite;
}

@keyframes limeRing {
  0%, 100% { box-shadow: 0 0 0 0 rgba(168,255,53,0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(168,255,53,0); }
}

/* ═══ Table utilities ═════════════════════════════════════════════════ */
.table-row-hover {
  transition: background 0.12s ease;
  cursor: pointer;
}
.table-row-hover:hover {
  background: var(--surface-2);
}

/* ═══ Card ════════════════════════════════════════════════════════════ */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.card-elevated {
  background: var(--surface-2);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
}

/* ═══ Focus visible ═══════════════════════════════════════════════════ */
:focus-visible {
  outline: 2px solid var(--lime);
  outline-offset: 2px;
}

/* ═══ Page header bar ═════════════════════════════════════════════════ */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1.5rem;
}

/* ═══ Form controls ═══════════════════════════════════════════════════ */
.input-field {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  padding: 0.8rem 1.1rem;
  font-size: 18px;
  transition: border-color 0.15s ease;
  font-family: inherit;
}
.input-field:focus {
  outline: none;
  border-color: var(--border-3);
}
.input-field::placeholder {
  color: var(--text-3);
}

/* ═══ Severity bar accent (left border on table rows) ════════════════ */
.row-critical { border-left: 3px solid var(--critical); }
.row-high     { border-left: 3px solid var(--high); }
.row-medium   { border-left: 3px solid var(--medium); }
.row-low      { border-left: 3px solid var(--low); }

/* ═══ Tab nav system ══════════════════════════════════════════════════ */
.tab-nav {
  display: flex;
  border-bottom: 1px solid var(--border);
  gap: 0;
}

.tab-btn {
  padding: 0.8rem 1.5rem;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-3);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s ease;
  cursor: pointer;
  white-space: nowrap;
}

.tab-btn:hover { color: var(--text-2); }
.tab-btn.active { color: var(--text); border-bottom-color: var(--lime); }

/* ═══ Stat card ═══════════════════════════════════════════════════════ */
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
}

/* ═══ Badge ═══════════════════════════════════════════════════════════ */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px solid;
  font-family: 'JetBrains Mono', monospace;
}

/* ═══ Alert banner ════════════════════════════════════════════════════ */
.alert-critical {
  background: rgba(245,56,56,0.08);
  border: 1px solid rgba(245,56,56,0.25);
  border-left: 3px solid var(--critical);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  color: #F08080;
}

.alert-warning {
  background: rgba(240,160,32,0.08);
  border: 1px solid rgba(240,160,32,0.2);
  border-left: 3px solid var(--warning);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  color: #C8900A;
}

.alert-info {
  background: rgba(12,154,232,0.07);
  border: 1px solid rgba(12,154,232,0.2);
  border-left: 3px solid var(--info);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  color: var(--info);
}

.alert-safe {
  background: rgba(12,200,107,0.07);
  border: 1px solid rgba(12,200,107,0.2);
  border-left: 3px solid var(--success);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  color: #0CB86B;
}

/* ═══ Demo data watermark ═════════════════════════════════════════════ */
.demo-banner {
  background: rgba(139,114,240,0.08);
  border: 1px solid rgba(139,114,240,0.2);
  border-radius: var(--radius-sm);
  color: #8B72F0;
  font-size: 14px;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 5px 11px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* ═══ Loading skeleton ════════════════════════════════════════════════ */
.skeleton {
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

/* ═══ Sidebar & layout ════════════════════════════════════════════════ */
.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.7rem 1.1rem;
  border-radius: var(--radius);
  font-size: 18px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  transition: all 0.12s ease;
  border: 1px solid transparent;
}

.sidebar-nav-item:hover {
  background: var(--surface-2);
  color: var(--text-2);
  border-color: var(--border);
}

.sidebar-nav-item.active {
  background: var(--surface-3);
  color: var(--text);
  border-color: var(--border-2);
}

.sidebar-nav-item.active .nav-icon {
  color: var(--lime);
}

/* ═══ Button system ═══════════════════════════════════════════════════ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.7rem 1.3rem;
  border-radius: var(--radius);
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  font-family: inherit;
  white-space: nowrap;
}

.btn-primary {
  background: var(--lime);
  color: #0C0F0D;
  border-color: var(--lime);
}
.btn-primary:hover { background: var(--lime-dim); border-color: var(--lime-dim); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: var(--surface-3);
  color: var(--text-2);
  border-color: var(--border-2);
}
.btn-secondary:hover { background: var(--surface-4); color: var(--text); border-color: var(--border-3); }

.btn-danger {
  background: var(--critical-bg);
  color: var(--critical);
  border-color: var(--critical-dim);
}
.btn-danger:hover { background: rgba(245,56,56,0.15); }

.btn-warning {
  background: var(--high-bg);
  color: var(--warning);
  border-color: #5A3008;
}
.btn-warning:hover { background: rgba(240,160,32,0.12); }

.btn-ghost {
  background: transparent;
  color: var(--text-3);
  border-color: transparent;
}
.btn-ghost:hover { background: var(--surface-2); color: var(--text-2); }

.btn-sm { padding: 0.45rem 0.9rem; font-size: 15.5px; }
.btn-lg { padding: 0.95rem 1.85rem; font-size: 20px; }

/* ═══ Filter chip system ═══════════════════════════════════════════════ */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-size: 17px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: all 0.12s ease;
}

.filter-chip:hover {
  background: var(--surface-2);
  color: var(--text-2);
  border-color: var(--border-2);
}

.filter-chip.active {
  background: var(--surface-3);
  color: var(--text);
  border-color: var(--border-3);
}

/* ═══ Data table ══════════════════════════════════════════════════════ */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 0.85rem 1.25rem;
  font-size: 14.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.data-table td {
  padding: 1rem 1.25rem;
  font-size: 17px;
  border-bottom: 1px solid var(--border);
  color: var(--text-2);
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr {
  cursor: pointer;
  transition: background 0.1s ease;
}

.data-table tbody tr:hover {
  background: var(--surface-2);
}

/* ═══ Tooltip overrides ═══════════════════════════════════════════════ */
.chart-tooltip {
  background: var(--surface-3) !important;
  border: 1px solid var(--border-2) !important;
  border-radius: var(--radius) !important;
  box-shadow: var(--shadow) !important;
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px !important;
  padding: 10px 14px !important;
}

/* ═══ Safety notice ═══════════════════════════════════════════════════ */
.safety-notice {
  background: rgba(12,154,232,0.06);
  border: 1px solid rgba(12,154,232,0.2);
  border-left: 3px solid var(--info);
  border-radius: var(--radius);
  padding: 1.1rem 1.4rem;
  font-size: 17px;
  color: #72C3EE;
  line-height: 1.6;
}

/* ═══ Simulated actions watermark ═════════════════════════════════════ */
.sim-badge {
  background: rgba(240,160,32,0.1);
  border: 1px solid rgba(240,160,32,0.25);
  color: #E8A020;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 4px 8px;
  border-radius: 4px;
}

/* ═══ Timeline ════════════════════════════════════════════════════════ */
.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

.timeline-line {
  width: 2px;
  flex-grow: 1;
  background: var(--border);
  margin: 4px 0;
  min-height: 24px;
}

/* ═══ KPI card ════════════════════════════════════════════════════════ */
.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s ease;
}

.kpi-card:hover {
  border-color: var(--border-2);
}

.kpi-value {
  font-size: 38px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.1;
  color: var(--text);
}

.kpi-label {
  font-size: 14.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
}

.kpi-sub {
  font-size: 16px;
  color: var(--text-3);
  margin-top: 3px;
}

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL TYPOGRAPHY SCALING SYSTEM (+30% Global Scale)
   Ensures comprehensive, consistent typography scaling across all
   public marketing pages and authenticated SOC dashboards.
   ═══════════════════════════════════════════════════════════════════ */

/* Standard text utilities scaled by 30% */
.text-xs   { font-size: 15.5px !important; line-height: 1.4 !important; }
.text-sm   { font-size: 18px !important; line-height: 1.5 !important; }
.text-base { font-size: 21px !important; line-height: 1.55 !important; }
.text-lg   { font-size: 23.5px !important; line-height: 1.5 !important; }
.text-xl   { font-size: 26px !important; line-height: 1.4 !important; }
.text-2xl  { font-size: 31px !important; line-height: 1.35 !important; }
.text-3xl  { font-size: 39px !important; line-height: 1.3 !important; }
.text-4xl  { font-size: 47px !important; line-height: 1.25 !important; }
.text-5xl  { font-size: 62px !important; line-height: 1.2 !important; }
.text-6xl  { font-size: 78px !important; line-height: 1.15 !important; }
.text-7xl  { font-size: 94px !important; line-height: 1.1 !important; }

/* Arbitrary pixel sizes scaled by ~30% */
.text-\[8px\], [class*="text-[8px]"]   { font-size: 11px !important; }
.text-\[9px\], [class*="text-[9px]"]   { font-size: 12.5px !important; }
.text-\[10px\], [class*="text-[10px]"] { font-size: 13.5px !important; }
.text-\[11px\], [class*="text-[11px]"] { font-size: 14.5px !important; }
.text-\[12px\], [class*="text-[12px]"] { font-size: 16px !important; }
.text-\[13px\], [class*="text-[13px]"] { font-size: 17px !important; }
.text-\[14px\], [class*="text-[14px]"] { font-size: 18.5px !important; }
.text-\[15px\], [class*="text-[15px]"] { font-size: 19.5px !important; }
.text-\[16px\], [class*="text-[16px]"] { font-size: 21px !important; }
.text-\[17px\], [class*="text-[17px]"] { font-size: 22px !important; }
.text-\[18px\], [class*="text-[18px]"] { font-size: 23.5px !important; }
.text-\[19px\], [class*="text-[19px]"] { font-size: 25px !important; }
.text-\[20px\], [class*="text-[20px]"] { font-size: 26px !important; }
.text-\[22px\], [class*="text-[22px]"] { font-size: 28.5px !important; }
.text-\[24px\], [class*="text-[24px]"] { font-size: 31px !important; }
.text-\[26px\], [class*="text-[26px]"] { font-size: 34px !important; }
.text-\[28px\], [class*="text-[28px]"] { font-size: 36.5px !important; }
.text-\[30px\], [class*="text-[30px]"] { font-size: 39px !important; }
.text-\[32px\], [class*="text-[32px]"] { font-size: 42px !important; }
.text-\[36px\], [class*="text-[36px]"] { font-size: 47px !important; }
.text-\[40px\], [class*="text-[40px]"] { font-size: 52px !important; }
.text-\[48px\], [class*="text-[48px]"] { font-size: 63px !important; }
.text-\[56px\], [class*="text-[56px]"] { font-size: 73px !important; }
.text-\[64px\], [class*="text-[64px]"] { font-size: 83px !important; }
.text-\[72px\], [class*="text-[72px]"] { font-size: 94px !important; }

/* Global Recharts typography & high-contrast theme */
.recharts-text {
  font-size: 14.5px !important;
  fill: #FFFFFF !important;
}
.recharts-cartesian-axis-tick text {
  font-size: 13.5px !important;
  fill: #FFFFFF !important;
}
.recharts-legend-item-text {
  font-size: 15px !important;
  color: #FFFFFF !important;
}
.recharts-default-tooltip,
.recharts-tooltip-wrapper {
  font-size: 15px !important;
}

/* Ensure headings have generous, professional enterprise line heights */
h1 { font-size: clamp(34px, 4vw, 54px); line-height: 1.2; }
h2 { font-size: clamp(26px, 3vw, 42px); line-height: 1.25; }
h3 { font-size: clamp(21px, 2.5vw, 32px); line-height: 1.3; }
h4 { font-size: clamp(18px, 2vw, 24px); line-height: 1.35; }

/* Enhanced table row height to prevent cramped content with larger text */
table tr {
  min-height: 48px;
}

```


################################################################################
### FILE 21/54: `src/main.tsx`
################################################################################

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```


################################################################################
### FILE 22/54: `src/marketing/About.tsx`
################################################################################

```tsx
import React from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function About() {
  const milestones = [
    {
      year: "Phase 1: Research & Virtual Testbed",
      title: "Foundational IoMT Attack Modeling",
      desc: "Simulated hospital DoS and DDoS attack vectors (MQTT floods, SYN storms) against virtual medical devices in a controlled research testbed.",
      status: "COMPLETED",
    },
    {
      year: "Phase 2: Interactive SOC Frontend & Case Memory",
      title: "Clinical-Safe Operational Platform",
      desc: "Architected the desktop-first SOC application, Case-Based Reasoning memory engine, clinical allowlists, and public educational portal.",
      status: "CURRENT RELEASE (v2.0)",
    },
    {
      year: "Phase 3: Live Passive Telemetry & Connector Backend",
      title: "Real-Time Switch Integration",
      desc: "Integration with live SPAN/mirror hardware taps, high-throughput Kafka streaming, and bilateral SIEM connectors for campus pilots.",
      status: "DEVELOPMENT ROADMAP",
    },
    {
      year: "Phase 4: Multi-Hospital Federated Defense",
      title: "Collaborative Healthcare Threat Intelligence",
      desc: "Federated Case Memory allowing participating hospital networks to share anonymized DoS attack mitigation playbooks without exposing PHI.",
      status: "FUTURE VISION",
    },
  ];

  const corePrinciples = [
    {
      num: "01",
      title: "Clinical Care Continuity Above All",
      desc: "No cybersecurity alert or automated rule is ever allowed to take down an active medical device or patient monitor without explicit human authorization.",
    },
    {
      num: "02",
      title: "Explainable Decisions Over Black-Box Automation",
      desc: "Hospital analysts must understand exactly why an alert fired, which historical cases support the response recommendation, and what risk it poses.",
    },
    {
      num: "03",
      title: "Zero Electronic Health Record Capture",
      desc: "MediSOC is mathematically isolated from patient private records. We inspect network flow metadata and transport headers only.",
    },
  ];

  return (
    <div className="w-full text-white pt-28 pb-20 relative overflow-hidden">
      {/* Cyber Network Mesh Background */}
      <div
        className="absolute top-0 left-0 right-0 h-[680px] bg-cover bg-center bg-no-repeat pointer-events-none opacity-45"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[680px] bg-gradient-to-b from-[#0C0F0D]/60 via-[#0C0F0D]/30 to-[#0C0F0D] pointer-events-none" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 max-w-[1280px] mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            OUR MISSION & VISION
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Defending the Digital Infrastructure <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            That Powers Patient Care
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-10">
          MediSOC was conceived to address a critical vulnerability in modern medicine: the dangerous intersection of legacy, unpatchable medical equipment and aggressive volumetric cyber attacks.
        </p>
      </section>

      {/* ── The Healthcare Problem Section ── */}
      <section className="px-6 max-w-[1100px] mx-auto mb-28">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#111713] border border-[var(--border)] grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-wider block mb-2">
              THE HEALTHCARE DILEMMA
            </span>
            <h2 className="text-[28px] sm:text-[34px] font-bold text-white mb-4">
              Why Traditional Cyber Defense Fails in Hospitals
            </h2>
            <div className="space-y-4 text-[14px] text-[var(--text-3)] leading-relaxed">
              <p>
                In a standard enterprise, if a server acts suspiciously, security teams isolate it immediately. But in a hospital ICU, isolating a connected infusion pump or patient telemetry monitor can sever real-time alarms and endanger human lives.
              </p>
              <p>
                Meanwhile, medical devices (IoMT) typically run legacy firmware that cannot support modern endpoint security agents. Hospitals are left with a dangerous blind spot: thousands of unmonitored devices on high-speed clinical subnets.
              </p>
              <p className="text-white font-medium">
                MediSOC provides the answer: 100% passive, agentless network monitoring paired with clinically safe, human-authorized mitigation.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0B0F0C] border border-[var(--border)] space-y-4">
            <div className="text-[11px] font-mono text-[var(--lime)] uppercase tracking-wider pb-2 border-b border-white/5">
              HOSPITAL THREAT PROFILE
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#141B16] border border-white/5">
                <div className="text-[12px] text-[var(--text-4)]">Average IoMT Devices per Hospital Bed</div>
                <div className="text-[20px] font-bold text-white">12 to 18 Connected Assets</div>
              </div>
              <div className="p-3 rounded-lg bg-[#141B16] border border-white/5">
                <div className="text-[12px] text-[var(--text-4)]">Percentage of IoMT Devices That Cannot Run Agents</div>
                <div className="text-[20px] font-bold text-[var(--danger)]">99.4% (Legacy/Proprietary OS)</div>
              </div>
              <div className="p-3 rounded-lg bg-[#141B16] border border-white/5">
                <div className="text-[12px] text-[var(--text-4)]">MediSOC Clinical Availability Standard</div>
                <div className="text-[20px] font-bold text-[var(--lime)]">100.0% Telemetry Continuity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Core Principles ── */}
      <section className="px-6 max-w-[1240px] mx-auto mb-28">
        <div className="text-center mb-12">
          <h2 className="text-[30px] sm:text-[40px] font-bold text-white mb-3">Our Core Principles</h2>
          <p className="text-[15px] text-[var(--text-3)]">The non-negotiable rules governing every feature we engineer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {corePrinciples.map((cp, idx) => (
            <div key={idx} className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] relative overflow-hidden">
              <span className="font-mono text-[36px] font-black text-[var(--lime)]/20 absolute top-4 right-4 select-none">
                {cp.num}
              </span>
              <h3 className="text-[18px] font-bold text-white mb-3">{cp.title}</h3>
              <p className="text-[13.5px] text-[var(--text-3)] leading-relaxed">{cp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Milestones & Roadmap Timeline ── */}
      <section className="px-6 max-w-[1000px] mx-auto mb-28">
        <div className="text-center mb-16">
          <h2 className="text-[30px] sm:text-[40px] font-bold text-white mb-3">Engineering Milestones & Roadmap</h2>
          <p className="text-[15px] text-[var(--text-3)]">From university healthcare testbed research to commercial hospital operations</p>
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-[var(--border)]">
          {milestones.map((m, idx) => (
            <div key={idx} className="flex items-start gap-6 relative">
              <div className="w-10 h-10 rounded-full bg-[#131915] border-2 border-[var(--lime)] flex items-center justify-center font-mono font-bold text-[13px] text-[var(--lime)] shrink-0 z-10 shadow-[0_0_15px_rgba(168,255,53,0.3)]">
                {idx + 1}
              </div>
              <div className="flex-1 p-6 rounded-2xl bg-[#111713] border border-[var(--border)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-mono text-[var(--text-4)] uppercase">{m.year}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[rgba(168,255,53,0.1)] text-[var(--lime)] self-start sm:self-auto">
                    {m.status}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2">{m.title}</h3>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-6 max-w-[800px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[30px] font-bold text-white mb-4">Partner with MediSOC</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          We collaborate with hospitals, biomedical engineering programs, and healthcare cybersecurity researchers.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Connect with Our Leadership
        </Link>
      </section>
    </div>
  );
}
```


################################################################################
### FILE 23/54: `src/marketing/Contact.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    hospital: "",
    role: "SOC Analyst",
    beds: "200-500 Beds",
    interest: "Full Platform Demo",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Full name is required.";
    if (!formData.email.trim()) {
      errs.email = "Work email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!formData.hospital.trim()) errs.hospital = "Hospital or healthcare organization is required.";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="w-full text-white pt-28 pb-20">
      {/* ── Hero ── */}
      <section className="px-6 max-w-[1280px] mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            INTERACTIVE DEMO & ENGAGEMENT
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Request a Custom <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            MediSOC Demonstration
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed">
          See how MediSOC protects your hospital network against DoS attacks and secures connected IoMT devices with zero disruption to patient care.
        </p>
      </section>

      {/* ── Form & Side Panel Layout ── */}
      <section className="px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Form Area (7 Cols) */}
          <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-[#111713] border border-[var(--border)] shadow-2xl relative">
            {submitted ? (
              <div className="py-12 text-center space-y-6 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] mx-auto flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-[26px] font-bold text-white">Demonstration Request Received</h3>
                <div className="p-4 rounded-xl bg-[#141B16] border border-[var(--border)] text-[13px] text-[var(--text-3)] text-left space-y-2">
                  <div className="font-mono text-[var(--lime)] font-bold text-[11px] uppercase">
                    SIMULATION NOTICE & NEXT STEPS
                  </div>
                  <p>
                    Because this is an active demonstration web environment, no live email server is currently connected. Your request has been validated and recorded locally.
                  </p>
                  <p>
                    You can access the full operational SOC platform right now with our pre-loaded hospital demonstration datasets:
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px] hover:bg-[#b5ff4d] transition-all"
                  >
                    Launch Interactive SOC Sandbox →
                  </Link>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#18201B] border border-[var(--border)] text-white text-[14px]"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-[22px] font-bold text-white mb-1">Book an Architecture Demo</h3>
                  <p className="text-[13px] text-[var(--text-3)]">Fill in your clinical or IT details below</p>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dr. Sarah Chen"
                      className={`w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border ${
                        errors.name ? "border-[var(--danger)]" : "border-[var(--border)]"
                      } text-white text-[14px] focus:outline-none focus:border-[var(--lime)]`}
                    />
                    {errors.name && <span className="text-[11px] text-[var(--danger)] mt-1 block">{errors.name}</span>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="s.chen@memorialhospital.org"
                      className={`w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border ${
                        errors.email ? "border-[var(--danger)]" : "border-[var(--border)]"
                      } text-white text-[14px] focus:outline-none focus:border-[var(--lime)]`}
                    />
                    {errors.email && <span className="text-[11px] text-[var(--danger)] mt-1 block">{errors.email}</span>}
                  </div>
                </div>

                {/* Hospital & Role Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Hospital / Organization *
                    </label>
                    <input
                      type="text"
                      value={formData.hospital}
                      onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                      placeholder="St. Jude Medical Center"
                      className={`w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border ${
                        errors.hospital ? "border-[var(--danger)]" : "border-[var(--border)]"
                      } text-white text-[14px] focus:outline-none focus:border-[var(--lime)]`}
                    />
                    {errors.hospital && (
                      <span className="text-[11px] text-[var(--danger)] mt-1 block">{errors.hospital}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Your Professional Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border border-[var(--border)] text-white text-[14px] focus:outline-none focus:border-[var(--lime)]"
                    >
                      <option value="CISO / Security Director">CISO / Security Director</option>
                      <option value="SOC Analyst / Lead">SOC Analyst / Lead</option>
                      <option value="Clinical / BioMed Engineer">Clinical / BioMed Engineer</option>
                      <option value="Network Infrastructure Lead">Network Infrastructure Lead</option>
                      <option value="Hospital IT Director">Hospital IT Director</option>
                    </select>
                  </div>
                </div>

                {/* Hospital Scale & Primary Interest */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Hospital Bed Capacity
                    </label>
                    <select
                      value={formData.beds}
                      onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border border-[var(--border)] text-white text-[14px] focus:outline-none focus:border-[var(--lime)]"
                    >
                      <option value="Under 200 Beds">&lt; 200 Beds (Community Clinic)</option>
                      <option value="200-500 Beds">200 – 500 Beds (Regional Hospital)</option>
                      <option value="500-1000 Beds">500 – 1,000 Beds (Major Medical Center)</option>
                      <option value="1000+ Beds">1,000+ Beds (Multi-Campus Health System)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                      Primary Defense Focus
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border border-[var(--border)] text-white text-[14px] focus:outline-none focus:border-[var(--lime)]"
                    >
                      <option value="IoMT Asset Visibility">IoMT Asset Visibility</option>
                      <option value="DoS & DDoS Defense">DoS & DDoS Attack Defense</option>
                      <option value="Case Memory & Response">Case Memory & Safe Response</option>
                      <option value="Full Platform Demo">Full Platform Walkthrough</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[12px] font-mono text-[var(--text-3)] uppercase mb-2">
                    Specific Architecture Inquiries (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your medical device fleet or switch topology..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0B0F0C] border border-[var(--border)] text-white text-[14px] focus:outline-none focus:border-[var(--lime)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-[var(--lime)] text-black font-bold text-[15px] hover:bg-[#b5ff4d] transition-all shadow-[0_0_25px_rgba(168,255,53,0.25)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Validating Request...</span>
                    </>
                  ) : (
                    <span>Submit Demonstration Request</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Supporting Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-[#111713] border border-[var(--border)] space-y-6">
              <h3 className="text-[20px] font-bold text-white">What Happens After Requesting?</h3>
              <ul className="space-y-4 text-[13.5px] text-[var(--text-3)]">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] font-mono font-bold text-[12px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    <strong className="text-white block">Interactive Sandbox Access:</strong> Instant demonstration access to pre-configured hospital topologies.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] font-mono font-bold text-[12px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    <strong className="text-white block">Architecture Consultation:</strong> Review of your hospital SPAN port infrastructure and clinical VLAN layout.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] font-mono font-bold text-[12px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>
                    <strong className="text-white block">Safe Pilot Deployment:</strong> 100% passive optical tap deployment with guaranteed zero patient telemetry impact.
                  </span>
                </li>
              </ul>
            </div>

            {/* Direct Demonstration Access Card */}
            <div className="p-8 rounded-3xl bg-[#151D17] border border-[var(--lime)]/30 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-[var(--lime)] text-[12px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-[var(--lime)] animate-pulse" />
                <span>TRY THE OPERATIONAL PLATFORM NOW</span>
              </div>
              <h4 className="text-[18px] font-bold text-white">Want to skip straight to the SOC?</h4>
              <p className="text-[13px] text-[var(--text-3)] leading-relaxed">
                Log into our demonstration portal with our analyst profile to inspect active incident timelines and test safe DoS rate-limiting.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[14px] font-bold text-[var(--lime)] hover:underline"
                >
                  <span>Go to Operational Sign In</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```


################################################################################
### FILE 24/54: `src/marketing/GenericPage.tsx`
################################################################################

```tsx
import React, { useState, useEffect } from "react";

export default function GenericPage({ title, subtitle }: { title: string, subtitle: string }) {
  useEffect(() => {
     window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="w-full pt-32 pb-24 px-6 min-h-[70vh] flex flex-col items-center text-center fade-in">
       <div className="w-16 h-16 rounded-[12px] bg-[rgba(168,255,53,0.1)] flex items-center justify-center mb-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
             <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
       </div>
       <h1 className="text-[36px] md:text-[48px] font-bold text-white mb-6">{title}</h1>
       <p className="text-[18px] text-[var(--text-3)] max-w-[600px] leading-relaxed mb-12">
          {subtitle}
       </p>
       
       <div className="card p-8 max-w-[800px] w-full text-left">
          <h2 className="text-[20px] font-semibold text-white mb-4">Under Development</h2>
          <p className="text-[14px] text-[var(--text-3)]">
             This is a demonstration placeholder for the <strong>{title}</strong> page. In a full production environment, this page would contain detailed marketing copy, product diagrams, and specific feature breakdowns.
          </p>
       </div>
    </div>
  );
}
```


################################################################################
### FILE 25/54: `src/marketing/Home.tsx`
################################################################################

```tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"overview" | "iomt" | "attack" | "memory">("overview");
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  // Fade-in on scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const workflowSteps = [
    {
      step: "01",
      title: "Passive Telemetry Ingestion",
      desc: "Captures NetFlow, Zeek metadata, and SPAN port traffic with zero disruption to patient monitoring streams and zero-PHI capture.",
      tech: "Passive SPAN / Zeek / DICOM Metadata",
    },
    {
      step: "02",
      title: "Behavioral & Anomaly Detection",
      desc: "Ensemble ML models (Random Forest, Autoencoder) detect volumetric DDoS, MQTT connection floods, and abnormal packet inter-arrival times.",
      tech: "Multi-Model Behavioral ML Engine",
    },
    {
      step: "03",
      title: "Case-Based Safe Reuse (CBR)",
      desc: "Queries historical case memory to match attack signatures against proven clinical response playbooks, scoring similarity & confidence.",
      tech: "k-NN Case Memory & Risk Scoring",
    },
    {
      step: "04",
      title: "Authorized Clinical Response",
      desc: "Presents transparent mitigation plans to SOC analysts. Enforces clinical allowlists to guarantee medical device uptime before any execution.",
      tech: "Human-In-The-Loop Approval & Audit",
    },
  ];

  return (
    <div className="w-full text-white overflow-hidden">
      {/* ── 1. Hero Section ── */}
      <section className="relative min-h-[94vh] flex flex-col items-center justify-center pt-28 pb-20 px-6 overflow-hidden bg-[#070A08]">
        
        {/* Full-Quality Hero Background Image (Original Colors & True Contrast) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundPosition: "center center",
          }}
        />

        {/* Hero Copy */}
        <div className="relative z-10 max-w-[980px] mx-auto text-center mt-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-8 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[var(--lime)] shadow-[0_0_8px_var(--lime)]" />
            <span className="text-[11.5px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
              HEALTHCARE CYBERSECURITY OPERATIONS PLATFORM
            </span>
          </div>

          <h1 className="text-[46px] sm:text-[62px] lg:text-[76px] font-extrabold tracking-tight leading-[1.08] mb-6">
            Protecting Healthcare. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] via-[#80FF72] to-[#8B72F0]">
              Securing Every Connection.
            </span>
          </h1>

          <p className="text-[18px] sm:text-[21px] text-[var(--text-3)] leading-relaxed mb-10 max-w-[760px] mx-auto font-normal">
            MediSOC empowers hospital security teams to detect network threats, protect connected medical devices (IoMT), and execute safe, evidence-driven incident responses without disrupting clinical patient care.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black text-[15px] font-bold hover:bg-[#b5ff4d] transition-all shadow-[0_0_30px_rgba(168,255,53,0.35)] hover:shadow-[0_0_40px_rgba(168,255,53,0.5)] active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Request a Demo</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--surface-3)] border border-[var(--border-2)] text-white text-[15px] font-medium hover:bg-[var(--surface-2)] hover:border-white/20 transition-all flex items-center justify-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
              <span>Explore the Platform</span>
            </Link>
          </div>
        </div>

        {/* ── Interactive Live Product Preview ── */}
        <div className="relative z-10 w-full max-w-[1240px] rounded-2xl border border-[var(--border-2)] bg-[#0E1310] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Mock Browser Header & Tab Switcher */}
          <div className="bg-[#151B17] border-b border-[var(--border)] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
              <span className="ml-3 text-[11px] font-mono text-[var(--text-4)] hidden sm:inline">
                https://soc.hospital.local/command-center
              </span>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="flex items-center gap-1 bg-[#0A0D0B] p-1 rounded-lg border border-[var(--border)]">
              {[
                { id: "overview", label: "Security Overview" },
                { id: "iomt", label: "IoMT Devices" },
                { id: "attack", label: "Attack Simulation" },
                { id: "memory", label: "Safe Case Memory" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? "bg-[var(--surface-4)] text-[var(--lime)] shadow-sm font-semibold"
                      : "text-[var(--text-3)] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Screen Content */}
          <div className="p-6 bg-[#0B0F0C] min-h-[420px]">
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Metric Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Active Hospital Incidents", val: "3 Critical", sub: "1 under investigation", color: "var(--danger)" },
                    { label: "Connected Medical Assets", val: "48 Devices", sub: "100% telemetry healthy", color: "var(--lime)" },
                    { label: "Detector Accuracy (F1)", val: "97.4%", sub: "Multi-model ensemble", color: "var(--info)" },
                    { label: "Clinical Availability Pledge", val: "100.0%", sub: "Zero device drops", color: "var(--success)" },
                  ].map((m, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#131915] border border-[var(--border)]">
                      <div className="text-[11px] uppercase tracking-wider text-[var(--text-3)] font-mono">{m.label}</div>
                      <div className="text-[22px] font-bold mt-1" style={{ color: m.color }}>{m.val}</div>
                      <div className="text-[11px] text-[var(--text-4)] mt-0.5">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Simulated Real-Time Traffic Wave */}
                <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-[14px] font-bold text-white">Live Clinical Network Telemetry (IoMT VLAN 104)</h4>
                      <p className="text-[12px] text-[var(--text-3)]">Real-time packet throughput with automated DoS threshold indicators</p>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[rgba(245,56,56,0.15)] text-[var(--danger)] border border-[rgba(245,56,56,0.3)]">
                      ANOMALY DETECTED: +412% MQTT Volumetric Spike
                    </span>
                  </div>

                  {/* SVG Chart Preview */}
                  <div className="h-44 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 800 160" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="heroAttackGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F53838" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#F53838" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="heroNormalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A8FF35" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#A8FF35" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="800" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                      <line x1="0" y1="80" x2="800" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                      <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                      {/* Normal Baseline Area */}
                      <path d="M0,130 C120,125 240,128 360,126 L360,160 L0,160 Z" fill="url(#heroNormalGrad)" />
                      <path d="M0,130 C120,125 240,128 360,126" fill="none" stroke="#A8FF35" strokeWidth="2" />

                      {/* Attack Spike Area */}
                      <path d="M360,126 C420,50 480,20 540,25 C600,30 660,110 800,120 L800,160 L360,160 Z" fill="url(#heroAttackGrad)" />
                      <path d="M360,126 C420,50 480,20 540,25 C600,30 660,110 800,120" fill="none" stroke="#F53838" strokeWidth="2.5" />
                    </svg>
                    <div className="absolute top-2 right-4 flex items-center gap-4 text-[11px] font-mono">
                      <span className="flex items-center gap-1.5 text-[var(--lime)]"><span className="w-2.5 h-1 bg-[var(--lime)] rounded" /> Clinical Baseline</span>
                      <span className="flex items-center gap-1.5 text-[var(--danger)]"><span className="w-2.5 h-1 bg-[var(--danger)] rounded" /> SYN/MQTT Flood</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "iomt" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="text-[13px] text-[var(--text-3)] mb-2">Live Connected Medical Device Inventory (Passive Discovery)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: "Alaris Infusion Pump 8100", ip: "192.168.10.12", room: "ICU Bed 04", risk: "HIGH RISK (88)", status: "MQTT Flood Victim", color: "var(--danger)" },
                    { name: "Philips IntelliVue MX800", ip: "192.168.10.45", room: "OR Suite 02", risk: "LOW RISK (18)", status: "Normal Telemetry", color: "var(--success)" },
                    { name: "GE Healthcare Gateway", ip: "192.168.10.01", room: "Telemetry Hub", risk: "MED RISK (52)", status: "Rate Limited (Safe)", color: "var(--warning)" },
                  ].map((dev, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#131915] border border-[var(--border)] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-[var(--text-4)]">{dev.ip}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono" style={{ color: dev.color, background: `${dev.color}15` }}>{dev.risk}</span>
                        </div>
                        <h4 className="text-[14px] font-semibold text-white mt-2">{dev.name}</h4>
                        <p className="text-[12px] text-[var(--text-3)]">{dev.room}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-4)]">Current State:</span>
                        <span className="font-semibold text-white">{dev.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "attack" && (
              <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)] space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-bold text-white">Live Attack Vector: Slowloris & TCP SYN Exhaustion</h4>
                  <span className="px-2.5 py-1 rounded bg-[rgba(168,255,53,0.1)] text-[var(--lime)] font-mono text-[11px]">MITIGATION ENGAGED</span>
                </div>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed">
                  Adversary IP <code>10.0.84.192</code> initiated a 45,000 req/sec SYN flood targeting the infusion telemetry bridge. MediSOC's behavioral engine isolated malicious sources within 1.2 seconds, preserving medical device telemetry streams.
                </p>
                <div className="p-3 bg-[#0C100D] rounded-lg font-mono text-[12px] text-[var(--text-2)] border border-white/5 space-y-1">
                  <div>[23:14:02.102] ALERT: Inbound rate exceeds 99th percentile baseline (+840%)</div>
                  <div>[23:14:02.418] DETECTOR: Ensemble confidence = 98.4% (RandomForest + Autoencoder)</div>
                  <div className="text-[var(--lime)]">[23:14:02.950] RECOMMENDATION: Route through safe rate-limiter (Preserves Clinical Allowlist)</div>
                </div>
              </div>
            )}

            {activeTab === "memory" && (
              <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)] space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-bold text-white">Case Memory Match: Historical Case #MED-2025-084</h4>
                  <span className="px-2 py-0.5 rounded bg-[rgba(139,114,240,0.15)] text-[#8B72F0] font-mono text-[11px]">96% PATTERN MATCH</span>
                </div>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed">
                  MediSOC compared current telemetry against 1,200+ historical hospital incident cases. The closest match was resolved via <strong>Selective Port Throttling</strong>, resulting in zero clinical alarm delay.
                </p>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="p-3 bg-[#0B0F0C] rounded border border-[var(--border)]">
                    <span className="text-[var(--text-4)] block text-[10px] uppercase">Historical Outcome</span>
                    <span className="text-[var(--success)] font-semibold">100% Threat Neutralized</span>
                  </div>
                  <div className="p-3 bg-[#0B0F0C] rounded border border-[var(--border)]">
                    <span className="text-[var(--text-4)] block text-[10px] uppercase">Clinical Disruption</span>
                    <span className="text-white font-semibold">0.0 seconds downtime</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. Core Capabilities Section (Varied Grid Layout) ── */}
      <section className="py-24 px-6 border-t border-[var(--border)] bg-[#0C100D]/50">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[32px] sm:text-[44px] font-bold tracking-tight text-white mb-4">
              Built Specifically for the Clinical Environment
            </h2>
            <p className="text-[16px] text-[var(--text-3)] leading-relaxed">
              General-purpose enterprise security tools fail in healthcare because they don't understand clinical context. MediSOC bridges security operations with patient safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Passive IoMT Discovery",
                desc: "100% passive profiling that identifies vendors, firmware, and clinical functions without sending active probes that could crash sensitive infusion systems.",
                tag: "ZERO SCANNING RISK",
                icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
              },
              {
                title: "DoS & DDoS Attack Defense",
                desc: "Detects both volumetric floods and low-and-slow DoS attacks on medical telemetry gateways using healthcare-trained anomaly models.",
                tag: "BEHAVIORAL ML",
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
              },
              {
                title: "Safe Reuse Case Memory",
                desc: "Learns from past hospital incidents. Recommends proven, field-tested remediation playbooks with similarity confidence metrics.",
                tag: "EXPLAINABLE AI",
                icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
              },
              {
                title: "Clinical Safety Allowlists",
                desc: "Prevents automated network isolation of critical life-support devices. Every disruptive action requires explicit human authorization.",
                tag: "PATIENT SAFETY FIRST",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              },
              {
                title: "Zero-PHI Telemetry Only",
                desc: "MediSOC inspects packet headers and protocol metadata only. No patient health records or identifiable health information are ever stored.",
                tag: "HIPAA-BY-DESIGN",
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
              },
              {
                title: "Forensic Audit Logging",
                desc: "Detailed record of every alert triage, rule trigger, and mitigation action, creating an accountable audit trail for hospital compliance.",
                tag: "AUDITABLE & ACCOUNTABLE",
                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] hover:border-[var(--lime)]/40 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group scroll-reveal opacity-0 translate-y-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[rgba(168,255,53,0.1)] flex items-center justify-center text-[var(--lime)] group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={card.icon} />
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-[var(--text-4)] border border-white/5 px-2 py-0.5 rounded">
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-[19px] font-bold text-white mb-3 group-hover:text-[var(--lime)] transition-colors">
                  {card.title}
                </h3>
                <p className="text-[14px] text-[var(--text-3)] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How MediSOC Works: Interactive Connected Pipeline ── */}
      <section className="py-24 px-6 border-t border-[var(--border)]">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center max-w-[700px] mx-auto mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[32px] sm:text-[44px] font-bold text-white mb-4">
              How MediSOC Works
            </h2>
            <p className="text-[16px] text-[var(--text-3)]">
              From raw hospital switch telemetry to clinically validated containment in four steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {workflowSteps.map((ws, i) => (
              <div
                key={i}
                onClick={() => setActiveWorkflowStep(i)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer relative ${
                  activeWorkflowStep === i
                    ? "bg-[#151D17] border-[var(--lime)] shadow-[0_0_30px_rgba(168,255,53,0.15)]"
                    : "bg-[#101512] border-[var(--border)] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[24px] font-extrabold text-[var(--lime)]">
                    {ws.step}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-[var(--text-4)] bg-white/5 px-2 py-0.5 rounded">
                    Stage {i + 1}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2">{ws.title}</h3>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed mb-4">{ws.desc}</p>
                <div className="text-[11px] font-mono text-[var(--lime)] bg-[rgba(168,255,53,0.06)] p-2 rounded border border-[rgba(168,255,53,0.15)]">
                  {ws.tech}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Comparison Table: Standard IT vs MediSOC Clinical SOC ── */}
      <section className="py-24 px-6 border-t border-[var(--border)] bg-[#0C100D]/40">
        <div className="max-w-[1080px] mx-auto">
          <div className="text-center mb-16 scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-[30px] sm:text-[40px] font-bold text-white mb-4">
              Standard IT EDR vs. MediSOC Healthcare SOC
            </h2>
            <p className="text-[15px] text-[var(--text-3)]">
              Why traditional IT security tooling cannot solve the IoMT crisis.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[#101612]">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#141C16] border-b border-[var(--border)] text-[12px] font-mono uppercase text-[var(--text-3)]">
                <tr>
                  <th className="p-4 pl-6">Capability / Requirement</th>
                  <th className="p-4 text-[var(--text-4)]">Traditional IT Tools (EDR/SIEM)</th>
                  <th className="p-4 pr-6 text-[var(--lime)]">MediSOC Clinical SOC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-2)]">
                {[
                  {
                    req: "Endpoint Agent Installation",
                    trad: "Required (Fails on medical devices)",
                    med: "100% Agentless & Passive SPAN/TAP",
                  },
                  {
                    req: "Automatic Device Quarantine",
                    trad: "Isolates without checking clinical state",
                    med: "Guarded by Clinical Allowlist Engine",
                  },
                  {
                    req: "Healthcare Protocol Decoding",
                    trad: "Generic TCP/UDP packet analysis",
                    med: "Native DICOM, HL7, MQTT, CoAP parsing",
                  },
                  {
                    req: "Incident History & Playbooks",
                    trad: "Static runbooks written for servers",
                    med: "Outcome-aware Case Memory (CBR)",
                  },
                  {
                    req: "Patient Safety & HIPAA Stance",
                    trad: "No clinical context awareness",
                    med: "Zero-PHI ingestion & human approval gates",
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="p-4 pl-6 font-semibold text-white">{row.req}</td>
                    <td className="p-4 text-[var(--text-3)]">{row.trad}</td>
                    <td className="p-4 pr-6 font-medium text-[var(--lime)] flex items-center gap-2">
                      <span>✓</span>
                      <span>{row.med}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 5. Closing High-Conversion CTA Banner ── */}
      <section className="py-24 px-6 border-t border-[var(--border)] bg-gradient-to-b from-[#0C0F0D] to-[#121A14]">
        <div className="max-w-[880px] mx-auto text-center scroll-reveal opacity-0 translate-y-8 transition-all duration-700">
          <div className="inline-block mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-[36px] sm:text-[48px] font-extrabold text-white tracking-tight mb-6">
            Experience the Future of Healthcare SOC Operations
          </h2>
          <p className="text-[17px] text-[var(--text-3)] mb-10 max-w-[620px] mx-auto leading-relaxed">
            Test our DoS detection and safe medical device response workflows in your browser with our interactive testbed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--lime)] text-black text-[15px] font-bold hover:bg-[#b5ff4d] transition-all shadow-[0_0_35px_rgba(168,255,53,0.35)]"
            >
              Request a Demonstration
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--surface-3)] border border-[var(--border-2)] text-white text-[15px] font-medium hover:bg-[var(--surface-2)] transition-all"
            >
              Access Operational SOC
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
```


################################################################################
### FILE 26/54: `src/marketing/Integrations.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface IntegrationItem {
  name: string;
  category: "network" | "siem" | "firewall" | "endpoint" | "iomt" | "alerting";
  status: "Supported (Testbed Verified)" | "Blueprint Available" | "Roadmap Connector";
  statusColor: string;
  desc: string;
  protocols: string;
}

export default function Integrations() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "all", label: "All Integrations" },
    { id: "network", label: "Network & Telemetry" },
    { id: "siem", label: "SIEM & XDR" },
    { id: "firewall", label: "Firewalls & NAC" },
    { id: "endpoint", label: "Endpoint Security" },
    { id: "iomt", label: "Medical Devices & IoMT" },
    { id: "alerting", label: "Alerting & ITSM" },
  ];

  const integrations: IntegrationItem[] = [
    // Network & Telemetry
    {
      name: "Cisco & Arista SPAN / Mirror Ports",
      category: "network",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "Passive switch port mirroring capturing raw Ethernet frames without impacting core transit latency.",
      protocols: "SPAN / RSPAN / ERSPAN / 10G SFP+",
    },
    {
      name: "Zeek & Suricata Network Sensor",
      category: "network",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "Protocol parsing for DICOM, HL7, and MQTT streams into structured JSON telemetry for MediSOC ingestion.",
      protocols: "NetFlow / IPFIX / JSON Kafka",
    },
    {
      name: "Gigamon & Ixia Network TAPs",
      category: "network",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Hardware network packet brokers for zero-loss optical tap aggregation across hospital data centers.",
      protocols: "Hardware Optical Tap / NetFlow v9",
    },

    // SIEM & XDR
    {
      name: "Splunk Enterprise Security",
      category: "siem",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Bilateral forwarding of enriched IoMT security alerts, risk indices, and MITRE ATT&CK healthcare tags.",
      protocols: "Splunk HEC / Syslog CEF",
    },
    {
      name: "Microsoft Sentinel",
      category: "siem",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Data connector streaming validated DoS incident telemetry into Azure Sentinel incident queues.",
      protocols: "Azure Monitor REST API / Log Analytics",
    },
    {
      name: "IBM QRadar SIEM",
      category: "siem",
      status: "Roadmap Connector",
      statusColor: "var(--text-3)",
      desc: "LEEF-formatted event stream integration for centralized hospital security operations dashboards.",
      protocols: "LEEF / Syslog TLS",
    },

    // Firewalls & NAC
    {
      name: "Palo Alto Networks Next-Gen Firewalls",
      category: "firewall",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Dynamic address group updates for upstream rate limiting during verified medical gateway DoS attacks.",
      protocols: "PAN-OS XML / REST API",
    },
    {
      name: "Fortinet FortiGate Firewalls",
      category: "firewall",
      status: "Roadmap Connector",
      statusColor: "var(--text-3)",
      desc: "Coordinated policy adjustments for hospital perimeter filtering under volumetric DDoS conditions.",
      protocols: "FortiOS REST API",
    },
    {
      name: "Cisco ISE (Identity Services Engine)",
      category: "firewall",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Clinical device quarantine coordination that checks MediSOC allowlists before modifying 802.1X VLANs.",
      protocols: "pxGrid / RADIUS Change of Auth (CoA)",
    },

    // Endpoint & Host Security
    {
      name: "CrowdStrike Falcon",
      category: "endpoint",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Cross-correlates clinical workstation alerts with network telemetry to identify infected nurse PCs launching internal floods.",
      protocols: "Falcon Streaming API / Webhooks",
    },
    {
      name: "Microsoft Defender for Endpoint",
      category: "endpoint",
      status: "Roadmap Connector",
      statusColor: "var(--text-3)",
      desc: "Ingests host-level process events from hospital imaging PACS servers alongside network anomaly streams.",
      protocols: "Graph Security API",
    },

    // Medical Devices & IoMT Ecosystems
    {
      name: "BD Alaris Infusion Ecosystem",
      category: "iomt",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "Passive MQTT and wireless gateway profile validation for Point-of-Care infusion pump fleets.",
      protocols: "802.11a/b/g/n / MQTT / TCP 1883",
    },
    {
      name: "Philips IntelliVue Patient Monitors",
      category: "iomt",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "Clinical telemetry heartbeat tracking over private hospital monitoring networks with zero device intrusion.",
      protocols: "Philips Private Telemetry / UDP Multicast",
    },
    {
      name: "GE Healthcare CARESCAPE Gateways",
      category: "iomt",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Passive DICOM / HL7 traffic baseline verification to detect slow-rate exfiltration or DoS disruptions.",
      protocols: "HL7 v2.x / DICOM Part 10",
    },

    // Alerting & ITSM
    {
      name: "ServiceNow ITSM & Clinical BioMed",
      category: "alerting",
      status: "Blueprint Available",
      statusColor: "var(--info)",
      desc: "Automated ticket routing creating paired cybersecurity and biomedical engineering maintenance tickets.",
      protocols: "ServiceNow Table REST API",
    },
    {
      name: "PagerDuty Clinical On-Call",
      category: "alerting",
      status: "Supported (Testbed Verified)",
      statusColor: "var(--lime)",
      desc: "High-priority on-call notification for critical medical telemetry loss requiring immediate SOC review.",
      protocols: "Events API v2",
    },
  ];

  const filtered = integrations.filter((item) => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.protocols.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="w-full text-white pt-28 pb-20 relative overflow-hidden">
      {/* Cyber Network Mesh Background */}
      <div
        className="absolute top-0 left-0 right-0 h-[680px] bg-cover bg-center bg-no-repeat pointer-events-none opacity-45"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[680px] bg-gradient-to-b from-[#0C0F0D]/60 via-[#0C0F0D]/30 to-[#0C0F0D] pointer-events-none" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 max-w-[1280px] mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            ECOSYSTEM INTEGRATIONS & CONNECTORS
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Connects Seamlessly With Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Existing Healthcare Stack
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-8">
          MediSOC ingests passive telemetry from core switches and exports enriched incident alerts to your SIEM, firewalls, and clinical ticketing systems.
        </p>

        {/* Clear Demonstration Disclosure */}
        <div className="inline-block p-4 rounded-xl bg-[#141B16] border border-[var(--border)] max-w-[720px] mx-auto text-[12px] text-[var(--text-3)]">
          <span className="font-bold text-[var(--lime)] font-mono">INTEGRATION STATUS DISCLOSURE:</span> MediSOC testbed integrations are verified in our virtual healthcare lab. Production enterprise connectors are available as architecture blueprints or on our active development roadmap.
        </div>
      </section>

      {/* ── Category Filter & Search ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-[var(--lime)] text-black font-bold shadow-[0_0_15px_rgba(168,255,53,0.2)]"
                    : "bg-[#121814] text-[var(--text-3)] hover:text-white border border-[var(--border)]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations, protocols..."
              className="w-full px-4 py-2 rounded-xl bg-[#121814] border border-[var(--border)] text-[13px] text-white focus:outline-none focus:border-[var(--lime)]"
            />
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#111713] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--lime)]/30 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded"
                    style={{ color: item.statusColor, background: `${item.statusColor}15` }}
                  >
                    {item.status}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-4)] uppercase">{item.category}</span>
                </div>
                <h3 className="text-[17px] font-bold text-white mb-2 group-hover:text-[var(--lime)] transition-colors">
                  {item.name}
                </h3>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed mb-4">{item.desc}</p>
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <span className="text-[10px] font-mono text-[var(--text-4)] block mb-1">PROTOCOLS / INTERFACE:</span>
                <div className="text-[11px] font-mono text-[var(--lime)] truncate">{item.protocols}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture Data Flow Diagram ── */}
      <section className="px-6 max-w-[1100px] mx-auto mt-20 p-8 sm:p-12 rounded-3xl bg-[#0E1310] border border-[var(--border)]">
        <h2 className="text-[26px] font-bold text-white mb-3 text-center">Bilateral Integration Data Flow</h2>
        <p className="text-[14px] text-[var(--text-3)] text-center max-w-[620px] mx-auto mb-10">
          How MediSOC sits non-intrusively in your hospital core and interfaces with security operations and firewalls.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--info)] block mb-1">INGESTION (PASSIVE)</span>
            <h4 className="font-bold text-white text-[15px] mb-2">Hospital Network SPAN / TAP</h4>
            <p className="text-[12px] text-[var(--text-3)]">
              Raw packet streams and flow records are mirrored into MediSOC with zero packet injection.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#151D17] border border-[var(--lime)]/40 shadow-lg">
            <span className="text-[11px] font-mono text-[var(--lime)] block mb-1">CORE ENGINE</span>
            <h4 className="font-bold text-white text-[15px] mb-2">MediSOC Platform</h4>
            <p className="text-[12px] text-[var(--text-3)]">
              Ensemble detection, Case Memory retrieval, and Clinical Safety Allowlist evaluation.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#131915] border border-[var(--border)]">
            <span className="text-[11px] font-mono text-[var(--success)] block mb-1">ORCHESTRATION (AUTHORIZED)</span>
            <h4 className="font-bold text-white text-[15px] mb-2">SIEM & Upstream Firewalls</h4>
            <p className="text-[12px] text-[var(--text-3)]">
              Approved upstream rate limits dispatched to Palo Alto / Fortinet; alerts forwarded to Splunk.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 max-w-[800px] mx-auto text-center border-t border-[var(--border)] pt-20 mt-20">
        <h2 className="text-[30px] font-bold text-white mb-4">Need a custom hospital protocol connector?</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Our engineering team regularly validates custom proprietary medical gateway protocols.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Request Integration Assessment
        </Link>
      </section>
    </div>
  );
}
```


################################################################################
### FILE 27/54: `src/marketing/MarketingLayout.tsx`
################################################################################

```tsx
import React from "react";
import { Outlet } from "react-router-dom";
import MarketingNavbar from "./components/MarketingNavbar";
import MarketingFooter from "./components/MarketingFooter";

export default function MarketingLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col selection:bg-[var(--lime)] selection:text-black">
      <MarketingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
```


################################################################################
### FILE 28/54: `src/marketing/Platform.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Platform() {
  const [activeModule, setActiveModule] = useState<string>("detection");

  const modules = [
    {
      id: "iomt",
      title: "IoMT Passive Profiling & Asset Mapping",
      tagline: "Agentless medical device visibility with clinical context",
      desc: "Automatically maps device models, firmware versions, MAC/IP, and clinical functions across hospital VLANs using passive network inspection.",
      features: [
        "Zero-scanning passive analysis (safe for infusion pumps and telemetry transmitters)",
        "Automated vendor and model fingerprinting (Alaris, Philips, GE, Baxter)",
        "Clinical criticality classification (Class I, II, III patient risk tiers)",
        "Continuous baseline communication profile modeling",
      ],
      badge: "VISIBILITY ENGINE",
    },
    {
      id: "detection",
      title: "Multi-Model DoS & Threat Detection",
      tagline: "High-accuracy anomaly detection trained on clinical network traffic",
      desc: "Combines Random Forest classifiers, Autoencoders, and protocol-aware statistical thresholds to catch volumetric and stealthy slow-rate DoS attacks.",
      features: [
        "Detection of TCP SYN floods, UDP amplification, and MQTT connection storms",
        "Sub-second alert triggering with statistical confidence percentages",
        "Thresholds calibrated for bursty hospital telemetry patterns",
        "Zero disruption to legitimate emergency telemetry traffic",
      ],
      badge: "BEHAVIORAL ML",
    },
    {
      id: "safereuse",
      title: "Outcome-Aware Case Memory (CBR)",
      tagline: "Historic incident knowledge that drives explainable triage",
      desc: "Utilizes Case-Based Reasoning to cross-reference active attacks with verified past hospital incidents, predicting mitigation effectiveness and patient safety impact.",
      features: [
        "Nearest-neighbor similarity matching against verified case repository",
        "Historical success and clinical impact scoring",
        "Explainable reasoning rationale with transparency indices",
        "Continuous feedback loop: records approved interventions and post-mitigation stability",
      ],
      badge: "EXPLAINABLE CBR",
    },
    {
      id: "response",
      title: "Controlled Clinical Response Controller",
      tagline: "Human-in-the-loop mitigation with strict clinical allowlists",
      desc: "Never drops a critical medical device off the network automatically. Proposes targeted rate limits, VLAN microsegmentation, and upstream source throttling.",
      features: [
        "Clinical Safety Allowlist engine (hard stop on patient monitor isolation)",
        "Mandatory SOC Analyst authorization and role-based confirmation",
        "Simulated outcome preview before policy execution",
        "Automated rollback trigger if clinical latency increases",
      ],
      badge: "SAFE CONTROL",
    },
  ];

  return (
    <div className="w-full text-white pt-28 pb-20 relative overflow-hidden">
      {/* Cyber Network Mesh Background */}
      <div
        className="absolute top-0 left-0 right-0 h-[680px] bg-cover bg-center bg-no-repeat pointer-events-none opacity-45"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[680px] bg-gradient-to-b from-[#0C0F0D]/60 via-[#0C0F0D]/30 to-[#0C0F0D] pointer-events-none" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 max-w-[1280px] mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            MEDISOC PLATFORM ARCHITECTURE
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Intelligent Defense Built for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Clinical Network Operations
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-10">
          Explore the modular architecture that enables hospital security teams to detect attacks, assess clinical risk, and execute safe responses in real time.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/contact" className="px-7 py-3 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px] hover:bg-[#b5ff4d] transition-all">
            Schedule Architecture Review
          </Link>
          <Link to="/dashboard" className="px-7 py-3 rounded-xl bg-[var(--surface-3)] border border-[var(--border-2)] text-white font-medium text-[14px] hover:bg-[var(--surface-2)] transition-all">
            Open Live SOC Demo
          </Link>
        </div>
      </section>

      {/* ── Architecture Diagram (Visual Data Flow) ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-28">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0F1410] border border-[var(--border)] shadow-2xl relative overflow-hidden">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-bold text-white">System Architecture & Telemetry Pipeline</h2>
              <p className="text-[14px] text-[var(--text-3)]">Continuous flow from passive tap to authorized hospital switch mitigation</p>
            </div>
            <span className="text-[11px] font-mono px-3 py-1 rounded bg-[rgba(168,255,53,0.1)] text-[var(--lime)] border border-[rgba(168,255,53,0.25)] self-start sm:self-auto">
              100% PASSIVE TAP INGESTION
            </span>
          </div>

          {/* Visual Architecture Stages */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                stage: "1. DATA SOURCE",
                title: "Hospital Network Tap",
                items: ["SPAN / Core Mirror Ports", "NetFlow / IPFIX Streams", "Passive Zeek / Suricata", "Zero-PHI Protocol Metadata"],
                color: "var(--text-2)",
              },
              {
                stage: "2. FEATURE EXTRACTION",
                title: "IoMT Telemetry Engine",
                items: ["Flow Duration & Packet Rates", "TCP Flag Distribution", "MQTT / DICOM Framing", "Baseline Deviation Score"],
                color: "var(--info)",
              },
              {
                stage: "3. DETECTION & CBR",
                title: "Ensemble ML & Memory",
                items: ["Random Forest Classifier", "Autoencoder Anomaly Model", "k-NN Case Memory Retrieval", "Clinical Risk Indexing"],
                color: "var(--lime)",
              },
              {
                stage: "4. SAFE EXECUTION",
                title: "Human Approval Gate",
                items: ["Clinical Safety Allowlist", "SOC Analyst Authorization", "Targeted Rate Limiting", "Tamper-Evident Audit Log"],
                color: "var(--success)",
              },
            ].map((box, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#141B16] border border-[var(--border)] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono tracking-wider mb-2" style={{ color: box.color }}>
                    {box.stage}
                  </div>
                  <h3 className="text-[16px] font-bold text-white mb-4">{box.title}</h3>
                  <ul className="space-y-2 text-[12px] text-[var(--text-3)]">
                    {box.items.map((it, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-[var(--lime)]">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-[var(--border)] text-[10px] font-mono text-[var(--text-4)] text-right">
                  Phase {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Deep-Dive Module Breakdown ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-28">
        <div className="text-center mb-12">
          <h2 className="text-[32px] sm:text-[40px] font-bold text-white mb-4">Core Platform Capabilities</h2>
          <p className="text-[16px] text-[var(--text-3)]">Select a capability module to inspect its technical implementation</p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                activeModule === m.id
                  ? "bg-[var(--lime)] text-black shadow-[0_0_20px_rgba(168,255,53,0.25)]"
                  : "bg-[#141B16] text-[var(--text-3)] hover:text-white border border-[var(--border)]"
              }`}
            >
              {m.title.split("&")[0]}
            </button>
          ))}
        </div>

        {/* Detailed Module Showcase */}
        {modules
          .filter((m) => m.id === activeModule)
          .map((m) => (
            <div key={m.id} className="p-8 sm:p-12 rounded-3xl bg-[#111713] border border-[var(--border)] grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-[rgba(168,255,53,0.1)] text-[var(--lime)] border border-[rgba(168,255,53,0.25)]">
                  {m.badge}
                </span>
                <h3 className="text-[28px] sm:text-[34px] font-bold text-white mt-4 mb-3">{m.title}</h3>
                <p className="text-[16px] text-[var(--lime)] font-medium mb-4">{m.tagline}</p>
                <p className="text-[14px] text-[var(--text-3)] leading-relaxed mb-6">{m.desc}</p>

                <div className="space-y-3">
                  {m.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3 text-[13px] text-[var(--text-2)]">
                      <span className="w-5 h-5 rounded-full bg-[rgba(168,255,53,0.15)] text-[var(--lime)] flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                        ✓
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Telemetry Card preview */}
              <div className="p-6 rounded-2xl bg-[#0B0F0C] border border-[var(--border)] font-mono text-[12px] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <span className="text-[var(--text-4)]">MODULE_STATUS</span>
                  <span className="text-[var(--lime)] font-bold">ACTIVE & OPERATIONAL</span>
                </div>
                <div className="text-[var(--text-3)] space-y-2">
                  <div>&gt; INGESTION_MODE: PASSIVE_SPAN_MIRROR</div>
                  <div>&gt; PACKET_SAMPLING_RATE: 1:1 (FULL_CAPTURE_METADATA)</div>
                  <div>&gt; MODEL_CONVERGENCE: LOSS &lt; 0.0024 (RF_ACCURACY=97.4%)</div>
                  <div>&gt; ALLOWLIST_ENFORCEMENT: STRICT_MODE (PATIENT_SAFETY=ON)</div>
                </div>
                <div className="p-3 rounded bg-[#131B15] text-[var(--lime)] border border-[rgba(168,255,53,0.2)]">
                  SAFE REUSE VERIFICATION: 1,248 historical cases validated without single clinical incident.
                </div>
              </div>
            </div>
          ))}
      </section>

      {/* ── CTA ── */}
      <section className="px-6 max-w-[900px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[32px] font-bold text-white mb-4">Ready to test the platform in action?</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Sign in to the operational SOC application to run simulations or review live incident cases.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/dashboard" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
            Launch SOC Application
          </Link>
          <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--surface-3)] text-white font-medium text-[14px] border border-[var(--border)]">
            Contact Engineering Team
          </Link>
        </div>
      </section>
    </div>
  );
}
```


################################################################################
### FILE 29/54: `src/marketing/Resources.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface ResourceItem {
  title: string;
  category: "guides" | "research" | "technical" | "faq";
  type: string;
  readTime: string;
  desc: string;
  badge: string;
}

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const resources: ResourceItem[] = [
    {
      title: "The Hospital SOC Guide to IoMT DDoS Defense",
      category: "guides",
      type: "Implementation Guide",
      readTime: "12 min read",
      desc: "A step-by-step engineering handbook on deploying passive SPAN taps, calibrating NetFlow thresholds, and defending smart infusion fleets without active scanning.",
      badge: "FEATURED GUIDE",
    },
    {
      title: "Case-Based Reasoning for Medical IoT Incident Triage",
      category: "technical",
      type: "Technical Whitepaper",
      readTime: "18 min read",
      desc: "An architectural deep-dive into how MediSOC's k-NN Case Memory retrieves verified historical hospital incident playbooks with quantified confidence scores.",
      badge: "ARCHITECTURE SPEC",
    },
    {
      title: "Analyzing MQTT and DICOM DoS Vectors in Critical Care",
      category: "research",
      type: "Threat Research Briefing",
      readTime: "9 min read",
      desc: "Empirical analysis of volumetric SYN floods vs low-and-slow MQTT connection exhaustion attacks against connected medical equipment.",
      badge: "LAB RESEARCH",
    },
    {
      title: "Zero-PHI Network Telemetry: A HIPAA-Compliant Model",
      category: "guides",
      type: "Compliance Whitepaper",
      readTime: "10 min read",
      desc: "How hospital security teams can analyze raw packet metadata for cyber anomalies while mathematically guaranteeing zero Electronic Health Record ingestion.",
      badge: "COMPLIANCE",
    },
    {
      title: "MediSOC API & Telemetry Ingestion Specification v2.0",
      category: "technical",
      type: "Developer Documentation",
      readTime: "15 min read",
      desc: "Comprehensive JSON schema definitions for streaming NetFlow, Zeek logs, and switch telemetry into the MediSOC detection pipeline.",
      badge: "DEVELOPER DOCS",
    },
    {
      title: "2026 Connected Medical Device Threat Landscape",
      category: "research",
      type: "Hospital Threat Index",
      readTime: "14 min read",
      desc: "Statistical breakdown of top exploited IoMT communication protocols, firmware vulnerabilities, and clinical impact distributions.",
      badge: "THREAT INDEX",
    },
  ];

  const faqs = [
    {
      q: "Does MediSOC actively scan or ping medical devices on the hospital network?",
      a: "No. MediSOC is 100% passive. It ingests mirrored network traffic via SPAN/mirror ports or optical network TAPs. It never transmits active probes or port sweeps that could disrupt sensitive medical equipment such as infusion pumps or ventilators.",
    },
    {
      q: "Can MediSOC automatically isolate or disconnect a patient's medical device?",
      a: "No. MediSOC enforces a strict Clinical Safety Allowlist and Human-In-The-Loop policy. Automated quarantining of critical medical equipment is fundamentally blocked. Any network mitigation (such as upstream IP rate limiting) requires explicit authorization by a SOC analyst.",
    },
    {
      q: "Does MediSOC capture or store Patient Health Information (PHI)?",
      a: "No. MediSOC inspects only packet headers and connection metadata (flow duration, byte counts, TCP flags, port distributions). No patient names, medical records, or sensitive clinical payloads are ever parsed, stored, or processed.",
    },
    {
      q: "What is the difference between this demonstration and production hospital deployment?",
      a: "The current web application is an interactive demonstration environment powered by realistic hospital testbed datasets and simulated incident workflows. It is ready for architectural review and testing prior to connecting live campus network taps.",
    },
    {
      q: "How does MediSOC's Case Memory assist hospital security analysts?",
      a: "Case-Based Reasoning (CBR) matches new incoming alerts against a repository of verified historical incidents. It shows the analyst how similar attacks were safely resolved in the past, including the exact mitigation playbook and clinical stability score.",
    },
  ];

  const filtered = resources.filter((item) => activeCategory === "all" || item.category === activeCategory);

  return (
    <div className="w-full text-white pt-28 pb-20 relative overflow-hidden">
      {/* Cyber Network Mesh Background */}
      <div
        className="absolute top-0 left-0 right-0 h-[680px] bg-cover bg-center bg-no-repeat pointer-events-none opacity-45"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[680px] bg-gradient-to-b from-[#0C0F0D]/60 via-[#0C0F0D]/30 to-[#0C0F0D] pointer-events-none" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 max-w-[1280px] mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            KNOWLEDGE BASE & TECHNICAL RESOURCES
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Healthcare Cybersecurity <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Research & Documentation
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-8">
          Explore technical whitepapers, deployment guides, threat research, and frequently asked questions on clinical IoMT network defense.
        </p>
      </section>

      {/* ── Filter Tabs ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-12">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: "all", label: "All Resources" },
            { id: "guides", label: "Deployment Guides" },
            { id: "technical", label: "Architecture Specs" },
            { id: "research", label: "Threat Research" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                activeCategory === tab.id
                  ? "bg-[var(--lime)] text-black"
                  : "bg-[#121814] text-[var(--text-3)] hover:text-white border border-[var(--border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Resources Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--lime)]/30 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold text-[var(--lime)] bg-[rgba(168,255,53,0.1)] px-2.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-4)]">{item.readTime}</span>
                </div>
                <h3 className="text-[18px] font-bold text-white mb-3 group-hover:text-[var(--lime)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[13px] text-[var(--text-3)] leading-relaxed mb-6">{item.desc}</p>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-[12px]">
                <span className="text-[var(--text-4)] font-mono">{item.type}</span>
                <span className="text-[var(--lime)] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read Briefing →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Frequently Asked Questions (Accordion) ── */}
      <section id="faq" className="px-6 max-w-[960px] mx-auto mt-24 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-[30px] sm:text-[40px] font-bold text-white mb-3">
            Frequently Asked Clinical Questions
          </h2>
          <p className="text-[15px] text-[var(--text-3)]">
            Answers to common clinical engineering, network architecture, and patient safety questions.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={i} className="rounded-2xl border border-[var(--border)] bg-[#111713] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-semibold text-[16px] text-white">{faq.q}</span>
                  <span className="text-[var(--lime)] font-mono text-[18px] shrink-0">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-[14px] text-[var(--text-3)] leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-6 max-w-[800px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[30px] font-bold text-white mb-4">Need specific testbed documentation?</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Contact our technical team for custom network schema definitions and protocol capture guides.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Request Technical Docs Packet
        </Link>
      </section>
    </div>
  );
}
```


################################################################################
### FILE 30/54: `src/marketing/SecurityCompliance.tsx`
################################################################################

```tsx
import React from "react";
import { Link } from "react-router-dom";

export default function SecurityCompliance() {
  const compliancePillars = [
    {
      title: "Zero-PHI Telemetry Architecture",
      regulation: "HIPAA Security Rule §164.312(a)",
      desc: "MediSOC inspects only packet headers, TCP flags, throughput metrics, and protocol metadata (e.g., MQTT message types). No Electronic Protected Health Information (ePHI) or patient records are ever captured, inspected, or stored in our database.",
      status: "Architectural Safeguard (Design Verified)",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    },
    {
      title: "Strict Role-Based Access Control (RBAC)",
      regulation: "HITECH Minimum Necessary Standard",
      desc: "Enforces strict role separation between SOC Analysts, Biomedical Engineers, and System Administrators. Sensitive forensic configurations and audit log exports are restricted to verified administrative tiers.",
      status: "Role Enforced in Frontend & State",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    },
    {
      title: "Tamper-Evident Audit Logging",
      regulation: "HIPAA §164.312(b) Audit Controls",
      desc: "Every alert acknowledgment, escalation, mitigation proposal, and response authorization is logged with full analyst attribution, timestamps, and target IP/device details, establishing a transparent chain of custody.",
      status: "Demonstration Audit Trail Active",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      title: "Clinical Safety Allowlists & Human Approval",
      regulation: "FDA Medical Device Safety Guidelines",
      desc: "Automated network disconnection of patient care devices is fundamentally banned. Potentially disruptive mitigation actions require explicit confirmation from authorized personnel, preventing accidental medical disruptions.",
      status: "Zero-Disruption Core Policy",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
    },
  ];

  return (
    <div className="w-full text-white pt-28 pb-20 relative overflow-hidden">
      {/* Cyber Network Mesh Background */}
      <div
        className="absolute top-0 left-0 right-0 h-[680px] bg-cover bg-center bg-no-repeat pointer-events-none opacity-45"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[680px] bg-gradient-to-b from-[#0C0F0D]/60 via-[#0C0F0D]/30 to-[#0C0F0D] pointer-events-none" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 max-w-[1280px] mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            GOVERNANCE, SECURITY & PATIENT SAFETY
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Patient Safety First. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Compliance by Design.
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-8">
          Healthcare cybersecurity requires a fundamentally different trust model. Discover how MediSOC protects clinical operations without compromising compliance or patient care.
        </p>

        {/* Honest Compliance Disclaimer */}
        <div className="inline-block p-4 rounded-xl bg-[#141B16] border border-[var(--border)] max-w-[760px] mx-auto text-[12px] text-[var(--text-3)] text-left">
          <span className="font-bold text-[var(--lime)] font-mono block mb-1">COMPLIANCE & CERTIFICATION TRANSPARENCY:</span>
          MediSOC is engineered from the ground up to align with HIPAA Security Rule and FDA medical device cybersecurity guidance. Formal third-party attestation (SOC 2 Type II, ISO 27001) is planned as the platform transitions from university testbed validation to commercial hospital deployments.
        </div>
      </section>

      {/* ── 4 Compliance Pillars ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {compliancePillars.map((p, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] hover:border-[var(--lime)]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(168,255,53,0.1)] flex items-center justify-center text-[var(--lime)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={p.icon} />
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--lime)] bg-[rgba(168,255,53,0.08)] px-2.5 py-1 rounded">
                    {p.status}
                  </span>
                </div>
                <h3 className="text-[20px] font-bold text-white mb-1">{p.title}</h3>
                <div className="text-[12px] font-mono text-[var(--text-4)] mb-3">{p.regulation}</div>
                <p className="text-[14px] text-[var(--text-3)] leading-relaxed">{p.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] text-[11px] font-mono text-[var(--text-4)]">
                Pillar {idx + 1} of 4 — Clinical Integrity Guarantee
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Layered Defense Architecture Visual ── */}
      <section className="px-6 max-w-[1100px] mx-auto mb-28 p-8 sm:p-12 rounded-3xl bg-[#0E1310] border border-[var(--border)]">
        <h2 className="text-[28px] font-bold text-white mb-2 text-center">Layered Healthcare Governance Model</h2>
        <p className="text-[14px] text-[var(--text-3)] text-center max-w-[620px] mx-auto mb-10">
          How MediSOC enforces zero clinical disruption across each technical layer.
        </p>

        <div className="space-y-4">
          {[
            {
              layer: "Layer 4: Human-in-the-Loop Governance",
              desc: "Explicit analyst signature required for network modifications. Automatic SOAR isolation is prohibited for Class II/III medical devices.",
              color: "var(--lime)",
            },
            {
              layer: "Layer 3: Clinical Safety Allowlist Engine",
              desc: "Verified IP/MAC allowlists protect infusion pumps, ventilators, and vital telemetry streams from collateral rate limiting.",
              color: "var(--success)",
            },
            {
              layer: "Layer 2: Zero-PHI Deep Metadata Inspection",
              desc: "Packets are inspected only for volumetric signatures, TCP syn-flood anomalies, and protocol framing. Payload text is immediately discarded.",
              color: "var(--info)",
            },
            {
              layer: "Layer 1: Passive SPAN Optical Isolation",
              desc: "MediSOC connects via unidirectional passive optical taps or SPAN ports, physically preventing any packet injection from reaching patient bedsides.",
              color: "var(--text-2)",
            },
          ].map((lyr, i) => (
            <div key={i} className="p-5 rounded-xl bg-[#141B16] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-bold block mb-1" style={{ color: lyr.color }}>
                  {lyr.layer}
                </span>
                <p className="text-[13px] text-[var(--text-3)]">{lyr.desc}</p>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded bg-white/5 text-[var(--text-2)] whitespace-nowrap self-start sm:self-auto">
                ENFORCED
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 max-w-[800px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[30px] font-bold text-white mb-4">Questions about hospital compliance?</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Request our technical compliance brief or review our testbed privacy safeguards with our security team.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Request Security & Compliance Packet
        </Link>
      </section>
    </div>
  );
}
```


################################################################################
### FILE 31/54: `src/marketing/Solutions.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Solutions() {
  const [selectedScenario, setSelectedScenario] = useState<number>(0);

  const solutions = [
    {
      id: "hospital",
      title: "Hospital & Health System Campus Security",
      problem:
        "Modern hospitals house thousands of connected devices across complex, multi-building campuses. A single compromised gateway or infected nursing workstation can cascade across unsegmented clinical VLANs, threatening entire hospital operations.",
      solution:
        "MediSOC continuously monitors hospital core traffic across multiple buildings. It identifies unauthorized lateral movement, mapping clinical device subnets to prevent malicious propagation while keeping clinical telemetry open.",
      benefits: [
        "Campus-wide passive network sensor deployment",
        "Clinical VLAN segmentation monitoring and anomaly detection",
        "Zero disruption to emergency room and operating theater networks",
      ],
      kpi: "100% Core Switch Visibility",
    },
    {
      id: "devices",
      title: "Connected Medical Device (IoMT) Protection",
      problem:
        "Infusion pumps, patient monitors, and anesthesia machines run proprietary, legacy operating systems that cannot support endpoint antivirus agents and rarely receive regular security patches.",
      solution:
        "MediSOC provides 100% agentless, passive profiling. It recognizes medical device behaviors (e.g., normal 1-minute telemetry heartbeats) and flags deviations instantly without active ping sweeps that risk device crashes.",
      benefits: [
        "Guaranteed agentless monitoring with zero software installation on medical equipment",
        "FDA-designated medical device risk tier classification (Class I, II, III)",
        "Automated vendor vulnerability (CVE) correlation without active probing",
      ],
      kpi: "Zero Clinical Device Scans",
    },
    {
      id: "ddos",
      title: "DoS & DDoS Attack Mitigation in Critical Care",
      problem:
        "A volumetric DDoS attack or Slowloris resource exhaustion targeting medical telemetry bridges can cause telemetry blackouts in ICUs, leaving doctors blind to sudden patient cardiac events.",
      solution:
        "MediSOC's ensemble ML engine separates legitimate sensor bursts from malicious SYN floods or MQTT connection storms within milliseconds. It recommends targeted upstream rate limiting so patient vital alarms continue uninterrupted.",
      benefits: [
        "Sub-second detection of high-volume and slow-rate DoS patterns",
        "Targeted IP/port rate throttling that isolates attackers instead of medical units",
        "Preservation of vital sign alarm transmission during cyber incidents",
      ],
      kpi: "< 1.2s Detection & Triage",
    },
    {
      id: "investigation",
      title: "Clinical SOC & Incident Investigation",
      problem:
        "SOC analysts are inundated with thousands of generic IT alerts and lack biomedical engineering context to understand whether an anomalous IP is an attacker or a portable X-ray unit.",
      solution:
        "MediSOC correlates alerts into unified incident timelines enriched with clinical metadata (device make, serial number, hospital room, patient criticality). Analysts investigate with complete clinical context at their fingertips.",
      benefits: [
        "Unified incident timeline consolidating network, device, and protocol events",
        "Direct mapping to MITRE ATT&CK for Healthcare and IoMT threat matrices",
        "Exportable forensic reports for hospital clinical leadership and compliance teams",
      ],
      kpi: "78% Reduction in Triage Time",
    },
    {
      id: "biomed",
      title: "BioMed Engineering & SOC Alignment",
      problem:
        "Cybersecurity analysts and biomedical engineering teams traditionally operate in silos with different tools, causing dangerous delays when a medical device is flagged.",
      solution:
        "MediSOC bridges the gap with dual-perspective reporting. SOC teams get packet-level threat telemetry, while clinical engineers get equipment location, firmware state, and maintenance status.",
      benefits: [
        "Shared view for both cybersecurity analysts and clinical engineering staff",
        "Role-based views preventing unauthorized configuration changes",
        "Coordinated remediation playbooks for medical equipment maintenance",
      ],
      kpi: "Cross-Functional Cohesion",
    },
    {
      id: "safety",
      title: "Safe & Accountable Incident Response",
      problem:
        "Automated SOAR playbooks in traditional cybersecurity often execute blunt isolation commands that can shut down network access for active patient care equipment, introducing severe clinical safety risks.",
      solution:
        "MediSOC enforces a strict Clinical Safety Allowlist and Human-In-The-Loop approval gates. Every response action must be verified by an analyst, and all decisions are cryptographically logged for accountability.",
      benefits: [
        "Guaranteed human authorization before any network modification",
        "Hard stops preventing automated quarantine of life-support equipment",
        "Tamper-evident audit logs documenting who approved each mitigation action",
      ],
      kpi: "Zero Inadvertent Disconnects",
    },
  ];

  const scenarios = [
    {
      title: "Scenario A: MQTT Broker Exhaustion on Infusion Subnet",
      context: "ICU Ward B, 32 Smart Infusion Pumps streaming rate telemetry",
      traditional: "Traditional IT firewall quarantines the entire switch port, cutting off telemetry to the central nursing station.",
      medisoc: "MediSOC identifies malicious external IP flooding MQTT port 1883, applies upstream rate limit, and keeps all 32 infusion pumps streaming without interruption.",
    },
    {
      title: "Scenario B: DICOM Imaging Gateway SYN Flood",
      context: "Radiology Department PACS server receiving emergency trauma scans",
      traditional: "Generic IPS rate-limits all DICOM traffic, delaying critical trauma brain scans from reaching the on-call surgeon.",
      medisoc: "MediSOC distinguishes authorized CT scanner endpoints from external spoofed SYN packets using baseline communication profiles, preserving emergency image transfers.",
    },
  ];

  return (
    <div className="w-full text-white pt-28 pb-20 relative overflow-hidden">
      {/* Cyber Network Mesh Background */}
      <div
        className="absolute top-0 left-0 right-0 h-[680px] bg-cover bg-center bg-no-repeat pointer-events-none opacity-45"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
          backgroundPosition: "center top",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[680px] bg-gradient-to-b from-[#0C0F0D]/60 via-[#0C0F0D]/30 to-[#0C0F0D] pointer-events-none" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 max-w-[1280px] mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(168,255,53,0.08)] border border-[rgba(168,255,53,0.25)] mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
          <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase tracking-widest">
            HEALTHCARE SECURITY SOLUTIONS
          </span>
        </div>

        <h1 className="text-[40px] sm:text-[56px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Tailored Defense for <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--lime)] to-[#8B72F0]">
            Every Hospital Environment
          </span>
        </h1>

        <p className="text-[17px] sm:text-[20px] text-[var(--text-3)] max-w-[760px] mx-auto leading-relaxed mb-10">
          Discover how MediSOC resolves the unique cyber challenges facing hospital networks, clinical engineering teams, and connected medical devices.
        </p>
      </section>

      {/* ── 6 Detailed Solution Cards ── */}
      <section className="px-6 max-w-[1280px] mx-auto mb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((sol) => (
            <div
              key={sol.id}
              className="p-8 rounded-2xl bg-[#111713] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--lime)]/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono font-bold text-[var(--lime)] bg-[rgba(168,255,53,0.1)] px-2.5 py-1 rounded">
                    {sol.kpi}
                  </span>
                </div>
                <h3 className="text-[20px] font-bold text-white mb-3">{sol.title}</h3>
                <div className="text-[13px] text-[var(--danger)]/90 font-medium mb-2">
                  <span className="uppercase text-[10px] font-mono block text-[var(--text-4)]">The Challenge</span>
                  {sol.problem}
                </div>
                <div className="text-[13px] text-[var(--text-3)] leading-relaxed mt-3 mb-6">
                  <span className="uppercase text-[10px] font-mono block text-[var(--lime)]">MediSOC Approach</span>
                  {sol.solution}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <span className="text-[11px] font-mono uppercase text-[var(--text-4)] block mb-2">Key Outcomes:</span>
                <ul className="space-y-1.5 text-[12px] text-[var(--text-2)]">
                  {sol.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[var(--lime)]">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Interactive Scenario Comparison ── */}
      <section className="px-6 max-w-[1100px] mx-auto mb-28">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0E1310] border border-[var(--border)]">
          <div className="text-center max-w-[700px] mx-auto mb-10">
            <h2 className="text-[28px] sm:text-[36px] font-bold text-white mb-3">
              Real-World Clinical Response Scenarios
            </h2>
            <p className="text-[14px] text-[var(--text-3)]">
              See the direct clinical difference between standard IT security automation and MediSOC's clinical-safe mitigation.
            </p>
          </div>

          {/* Scenario Tabs */}
          <div className="flex justify-center gap-3 mb-8">
            {scenarios.map((sc, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedScenario(idx)}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                  selectedScenario === idx
                    ? "bg-[var(--lime)] text-black"
                    : "bg-[#141B16] text-[var(--text-3)] border border-[var(--border)] hover:text-white"
                }`}
              >
                {sc.title.split(":")[0]}
              </button>
            ))}
          </div>

          {/* Scenario Content */}
          <div className="bg-[#131915] p-6 rounded-2xl border border-[var(--border)] space-y-6">
            <div>
              <h3 className="text-[17px] font-bold text-white mb-1">{scenarios[selectedScenario].title}</h3>
              <p className="text-[12px] font-mono text-[var(--text-4)]">{scenarios[selectedScenario].context}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[#1A1111] border border-[var(--danger)]/30">
                <span className="text-[11px] font-mono font-bold text-[var(--danger)] uppercase block mb-2">
                  ❌ Standard Enterprise IT Tool Action
                </span>
                <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
                  {scenarios[selectedScenario].traditional}
                </p>
                <div className="mt-4 text-[11px] font-mono text-[var(--danger)]">
                  RESULT: High clinical patient risk due to lost telemetry
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#111A13] border border-[var(--lime)]/30">
                <span className="text-[11px] font-mono font-bold text-[var(--lime)] uppercase block mb-2">
                  ✓ MediSOC Clinical SOC Action
                </span>
                <p className="text-[13px] text-[var(--text-2)] leading-relaxed">
                  {scenarios[selectedScenario].medisoc}
                </p>
                <div className="mt-4 text-[11px] font-mono text-[var(--lime)]">
                  RESULT: Threat neutralized; 100% patient care continuity
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-6 max-w-[900px] mx-auto text-center border-t border-[var(--border)] pt-20">
        <h2 className="text-[32px] font-bold text-white mb-4">Tailored to your hospital environment</h2>
        <p className="text-[15px] text-[var(--text-3)] mb-8">
          Speak with our healthcare cybersecurity engineers to evaluate MediSOC on your network topology.
        </p>
        <Link to="/contact" className="px-8 py-3.5 rounded-xl bg-[var(--lime)] text-black font-bold text-[14px]">
          Request a Custom Demonstration
        </Link>
      </section>
    </div>
  );
}
```


################################################################################
### FILE 32/54: `src/marketing/components/MarketingFooter.tsx`
################################################################################

```tsx
import React from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--border)] pt-20 pb-12 bg-[#0C0F0D] text-white/80">
      <div className="max-w-[1520px] mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16 mb-20">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="mb-2">
              <Logo size="xl" clickable to="/" />
            </div>
            <p className="text-[18px] leading-relaxed max-w-[420px] text-white/85">
              MediSOC delivers specialized, clinical-aware cybersecurity operations for hospital networks and connected medical devices (IoMT), empowering security teams with safe detection and evidence-based response.
            </p>
            <div className="flex items-center gap-3 text-[15px] font-mono text-[var(--lime)] font-semibold pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--lime)] animate-pulse" />
              <span>SOC Testbed Status: Online & Monitoring</span>
            </div>
          </div>

          {/* Column 1: Platform & Capabilities */}
          <div>
            <h4 className="text-[18px] font-extrabold text-white uppercase tracking-wider mb-5">Platform</h4>
            <ul className="space-y-3.5 text-[17px]">
              <li><Link to="/platform" className="hover:text-white transition-colors">Overview</Link></li>
              <li><Link to="/platform#iomt" className="hover:text-white transition-colors">IoMT Device Inventory</Link></li>
              <li><Link to="/platform#detection" className="hover:text-white transition-colors">DoS/DDoS Detection</Link></li>
              <li><Link to="/platform#safereuse" className="hover:text-white transition-colors">Safe Reuse Case Memory</Link></li>
              <li><Link to="/platform#architecture" className="hover:text-white transition-colors">System Architecture</Link></li>
              <li><Link to="/dashboard" className="text-[var(--lime)] hover:underline inline-flex items-center gap-1 font-semibold">Open SOC App →</Link></li>
            </ul>
          </div>

          {/* Column 2: Solutions & Integrations */}
          <div>
            <h4 className="text-[18px] font-extrabold text-white uppercase tracking-wider mb-5">Solutions</h4>
            <ul className="space-y-3.5 text-[17px]">
              <li><Link to="/solutions" className="hover:text-white transition-colors">Hospital Network Defense</Link></li>
              <li><Link to="/solutions#devices" className="hover:text-white transition-colors">Medical Device Protection</Link></li>
              <li><Link to="/solutions#ddos" className="hover:text-white transition-colors">Critical Care DoS Resilience</Link></li>
              <li><Link to="/solutions#biomed" className="hover:text-white transition-colors">BioMed & Clinical Alignment</Link></li>
              <li><Link to="/integrations" className="hover:text-white transition-colors">Telemetry & SIEM Integrations</Link></li>
              <li><Link to="/security" className="hover:text-white transition-colors">Security & Compliance</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources & Company */}
          <div>
            <h4 className="text-[18px] font-extrabold text-white uppercase tracking-wider mb-5">Company & Resources</h4>
            <ul className="space-y-3.5 text-[17px]">
              <li><Link to="/about" className="hover:text-white transition-colors">About MediSOC</Link></li>
              <li><Link to="/resources" className="hover:text-white transition-colors">Knowledge Base & Guides</Link></li>
              <li><Link to="/resources#faq" className="hover:text-white transition-colors">Clinical FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Request a Demonstration</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors font-semibold text-[var(--lime)]">Analyst Login →</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-6 text-[15.5px] text-white/75 font-medium">
          <div>
            © {new Date().getFullYear()} MediSOC Healthcare Cybersecurity. All rights reserved. Demonstration testbed environment.
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-white font-mono">HIPAA-Aligned Architecture</span>
            <span className="text-white font-mono">Zero-PHI Ingestion</span>
            <span className="text-white font-mono">Safe Clinical Response Guarantee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
```


################################################################################
### FILE 33/54: `src/marketing/components/MarketingNavbar.tsx`
################################################################################

```tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "../../components/Logo";

export default function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const navItems = [
    { label: "Home", path: "/" },
    {
      label: "Platform",
      path: "/platform",
      dropdown: [
        { label: "Platform Overview", path: "/platform", desc: "End-to-end healthcare SOC architecture" },
        { label: "IoMT Visibility", path: "/platform#iomt", desc: "Passive profiling of connected medical equipment" },
        { label: "Threat Detection", path: "/platform#detection", desc: "DoS/DDoS and anomaly behavior models" },
        { label: "Safe Reuse Engine", path: "/platform#safereuse", desc: "Case Memory and historical incident reasoning" },
      ],
    },
    {
      label: "Solutions",
      path: "/solutions",
      dropdown: [
        { label: "Hospital Network Security", path: "/solutions#hospital", desc: "Whole-campus telemetry and segmentation" },
        { label: "Connected Medical Devices", path: "/solutions#devices", desc: "Protection for infusion pumps & monitors" },
        { label: "DoS & DDoS Defense", path: "/solutions#ddos", desc: "Preserving clinical bandwidth in emergencies" },
        { label: "Clinical BioMed Alignment", path: "/solutions#biomed", desc: "Bridging SOC analysts with clinical engineering" },
      ],
    },
    { label: "Integrations", path: "/integrations" },
    { label: "Security & Compliance", path: "/security" },
    { label: "Resources", path: "/resources" },
    { label: "About", path: "/about" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0C0F0D]/95 backdrop-blur-md border-b border-[var(--border)] py-3 shadow-2xl shadow-black/60"
          : "bg-[#0C0F0D]/75 backdrop-blur-md py-4.5 border-b border-white/[0.08]"
      }`}
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 flex items-center justify-between gap-4">
        {/* Left Corner: Official MediSOC Logo + Healthcare SOC Text */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lime)] rounded-lg group py-1"
          >
            {/* Official Logo Component */}
            <Logo size="sm" variant="white" showText={true} />

            {/* Healthcare SOC badge */}
            <div className="hidden sm:flex items-center pl-2.5 border-l border-white/20">
              <span className="text-[12px] font-mono font-bold uppercase tracking-wider text-[var(--lime)] bg-[rgba(168,255,53,0.12)] border border-[rgba(168,255,53,0.3)] px-2.5 py-0.5 rounded-md whitespace-nowrap shadow-sm">
                Healthcare SOC
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links with generous spacing */}
        <nav className="hidden xl:flex items-center gap-1.5 2xl:gap-3 text-[15.5px] font-medium" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const hasDropdown = Boolean(item.dropdown);

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => hasDropdown && setActiveDropdown(item.label)}
                onMouseLeave={() => hasDropdown && setActiveDropdown(null)}
              >
                <Link
                  to={item.path}
                  className={`px-3 py-2 rounded-lg transition-all duration-150 inline-flex items-center gap-1 whitespace-nowrap ${
                    isActive
                      ? "text-white bg-white/[0.12] font-semibold shadow-inner"
                      : "text-white/85 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <span>{item.label}</span>
                  {hasDropdown && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className={`transition-transform duration-200 opacity-70 ${activeDropdown === item.label ? "rotate-180 opacity-100" : ""}`}
                    >
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Link>

                {/* Dropdown Menu */}
                {hasDropdown && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 w-84 pt-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-[#131815] border border-[var(--border-2)] rounded-2xl p-3 shadow-2xl shadow-black/90 backdrop-blur-2xl">
                      {item.dropdown!.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.path}
                          className="block px-4 py-3 rounded-xl hover:bg-white/[0.08] transition-colors group"
                        >
                          <div className="text-[15px] font-semibold text-white group-hover:text-[var(--lime)] flex items-center justify-between">
                            <span>{sub.label}</span>
                            <span className="text-[13px] text-[var(--lime)] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                          </div>
                          <div className="text-[13px] text-white/70 mt-1 leading-snug">{sub.desc}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Corner: Action CTAs */}
        <div className="hidden xl:flex items-center gap-3 shrink-0">
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-[15.5px] font-semibold text-white hover:bg-white/[0.1] transition-all whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-lg bg-[var(--lime)] text-black text-[15.5px] font-extrabold hover:bg-[#b5ff4d] transition-all shadow-[0_0_20px_rgba(168,255,53,0.3)] hover:shadow-[0_0_30px_rgba(168,255,53,0.5)] active:scale-95 whitespace-nowrap"
          >
            Request a Demo
          </Link>
        </div>

        {/* Mobile Navigation Toggle */}
        <button
          className="xl:hidden text-white p-2.5 rounded-xl hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[var(--lime)]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer — enlarged typography */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0C0F0D]/98 border-b border-[var(--border)] px-8 py-8 flex flex-col gap-4 shadow-2xl backdrop-blur-2xl">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`text-[20px] py-2.5 px-4 rounded-xl font-semibold transition-colors ${
                location.pathname === item.path
                  ? "text-white bg-white/[0.12]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="h-px bg-white/10 my-3" />
          <Link
            to="/login"
            className="text-[20px] py-2.5 px-4 text-white font-semibold hover:bg-white/[0.06] rounded-xl"
          >
            Sign In to SOC Platform
          </Link>
          <Link
            to="/contact"
            className="w-full text-center py-4 rounded-xl bg-[var(--lime)] text-black text-[20px] font-extrabold shadow-xl mt-2"
          >
            Request a Demo
          </Link>
        </div>
      )}
    </header>
  );
}
```


################################################################################
### FILE 34/54: `src/screens/AcceptInvitation.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real flow, this email would come from the invitation token in the URL
  const inviteEmail = "new.analyst@iomt-testbed.local";

  const isStrong = pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !pass || !confirm) { setError("Please fill in all fields."); return; }
    if (pass !== confirm) { setError("Passwords do not match."); return; }
    if (!isStrong) { setError("Password does not meet requirements."); return; }
    
    setError(null);
    setLoading(true);

    // Mock network request
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSuccess(true);
  }

  return (
    <div className="min-h-screen bg-[#0C0F0D] flex items-center justify-center relative overflow-hidden">
      {/* Background decorations matching Login */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#B6FF3B" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#B6FF3B] opacity-[0.03] blur-[120px] pointer-events-none"/>

      <div className="relative w-full max-w-[400px] px-6 fade-in py-12">
        <div className="mb-8 text-center">
          <h1 className="font-bold text-[32px] text-[#E8EDE9] leading-snug tracking-tight">Accept Invitation</h1>
          <p className="text-[15px] text-[#94A8BA] mt-2">You have been invited to join MediSOC as an Analyst.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111511] border border-[#242924] rounded-[16px] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
          noValidate
        >
          {error && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-5 rounded-[8px] text-[14px]"
              style={{ background: "#1C0808", border: "1px solid #3A1010", color: "#F87171" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-[#14291A] border border-[#1A3D22] rounded-full mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </div>
               <div className="text-[17px] font-semibold text-[#E8EDE9] mb-2">Account Created</div>
               <div className="text-[14px] text-[#94A8BA] mb-6">
                 Your account has been set up successfully. We sent a verification link to your email to verify your identity.
               </div>
               
               {/* Note for reviewers */}
               <div className="mb-6 p-3 bg-[#0A0E14] border border-[#1A2A3A] rounded-[8px] text-[12px] text-[#5A8AAA] text-left">
                 <strong>Mock Note:</strong> Account creation is simulated. Proceeding will simulate clicking the email verification link.
               </div>

               <Link to="/verify-email"
                 className="w-full flex items-center justify-center py-3 rounded-[10px] text-[15px] font-bold mono uppercase tracking-widest transition-all bg-[#1A1E1B] text-[#C8CEC8] border border-[#2A302B] hover:bg-[#242924]"
               >
                 Simulate Verification Link →
               </Link>
            </div>
          ) : (
            <>
              {/* Email (Read-only) */}
              <div className="mb-4">
                <label className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#94A8BA] bg-[#1A1E1B] focus:outline-none mono opacity-70"
                />
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <label htmlFor="invite-name" className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <input
                  id="invite-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors disabled:opacity-50"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono pr-10 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A8BA] hover:text-[#C8CEC8]"
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Password strength indicators */}
              <div className="flex gap-2 mb-4">
                <div className={`h-1.5 flex-1 rounded-full ${pass.length >= 8 ? 'bg-[#22C55E]' : 'bg-[#242924]'}`}/>
                <div className={`h-1.5 flex-1 rounded-full ${/[A-Z]/.test(pass) ? 'bg-[#22C55E]' : 'bg-[#242924]'}`}/>
                <div className={`h-1.5 flex-1 rounded-full ${/[0-9]/.test(pass) ? 'bg-[#22C55E]' : 'bg-[#242924]'}`}/>
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono pr-10 disabled:opacity-50"
                  />
                  {confirm.length > 0 && confirm === pass && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22C55E]">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all disabled:opacity-60"
                style={{
                  background: loading ? "#8AB82A" : "#B6FF3B",
                  color: "#0C0F0D",
                  boxShadow: loading ? "none" : "0 0 20px rgba(182,255,59,0.25)",
                }}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 35/54: `src/screens/AttackSimulation.tsx`
################################################################################

```tsx
import React, { useState, useEffect } from "react";
import type { Screen } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";

interface Props {
  onNavigate: (s: Screen) => void;
}

export default function AttackSimulation({ onNavigate }: Props) {
  // Simulation Parameter States
  const [attackMode, setAttackMode] = useState<"DoS" | "DDoS">("DDoS");
  const [attackVector, setAttackVector] = useState("MQTT Connect Flood");
  const [targetDevice, setTargetDevice] = useState("Gateway-01");
  const [intensity, setIntensity] = useState<"Low" | "Medium" | "High">("Medium");
  const [duration, setDuration] = useState<"30 sec" | "60 sec" | "120 sec">("120 sec");
  const [sourceCount, setSourceCount] = useState("1");
  const [runNote, setRunNote] = useState("");

  // Execution States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ time: string; text: string; type: "info" | "warn" | "crit" | "success" }>>([]);
  const [simCompleted, setSimCompleted] = useState(false);
  const [reportExported, setReportExported] = useState(false);

  // Live Metrics during simulation
  const [packetRate, setPacketRate] = useState(0);
  const [bandwidth, setBandwidth] = useState(0);
  const [targetLatency, setTargetLatency] = useState(4.2);

  // Vectors list
  const vectors = [
    { value: "MQTT Connect Flood", label: "MQTT Connect Flood (DDoS Broker Exhaustion)" },
    { value: "SYN Flood (ICU Telemetry)", label: "SYN Flood (ICU Vital Signs Stream)" },
    { value: "UDP Amplification", label: "UDP Amplification (PACS Archive Port 104)" },
    { value: "DICOM Stream Flooding", label: "DICOM C-STORE Flood (Imaging Station)" },
    { value: "HL7 Telemetry Starvation", label: "HL7 EHR Interface Starvation" },
    { value: "HTTP Slowloris", label: "HTTP Slowloris (Infusion Pump Gateway)" },
  ];

  // Target devices list
  const devices = [
    { id: "Gateway-01", label: "Gateway-01 (10.0.4.15 · IoMT Edge Gateway)", ip: "10.0.4.15", type: "Gateway" },
    { id: "Infusion-Pump-3B", label: "Infusion-Pump-3B (10.0.4.102 · Alaris Medley)", ip: "10.0.4.102", type: "Infusion Pump" },
    { id: "Patient-Monitor-ICU-04", label: "Patient-Monitor-ICU-04 (10.0.4.88 · Philips IntelliVue)", ip: "10.0.4.88", type: "Monitor" },
    { id: "MRI-Scanner-02", label: "MRI-Scanner-02 (10.0.5.12 · Siemens Magnetom)", ip: "10.0.5.12", type: "Imaging" },
    { id: "Ventilator-CCU-01", label: "Ventilator-CCU-01 (10.0.4.45 · Puritan Bennett 980)", ip: "10.0.4.45", type: "Ventilator" },
  ];

  // Checklist items
  const checklist = [
    { label: "Lab mode enabled", ok: true },
    { label: "Target device online", ok: true },
    { label: "Edge pipeline healthy", ok: true },
    { label: "Detector online", ok: true },
    { label: "Controller online", ok: true },
    { label: "Database online", ok: true },
    { label: "Baseline monitoring ready", ok: true },
  ];

  // Run simulation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (running) {
      timer = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          const maxSec = duration === "30 sec" ? 30 : duration === "60 sec" ? 60 : 120;
          const pct = Math.min(100, Math.round((next / maxSec) * 100));
          setProgress(pct);

          // Dynamic metrics
          const intensityMultiplier = intensity === "Low" ? 500 : intensity === "Medium" ? 1800 : 4200;
          setPacketRate(Math.floor(intensityMultiplier + Math.random() * 400));
          setBandwidth(parseFloat((intensityMultiplier * 0.008 + Math.random() * 0.5).toFixed(2)));
          setTargetLatency(parseFloat((4.2 + (pct / 10) * 8.5 + Math.random() * 15).toFixed(1)));

          // Step updates
          if (pct > 20 && activeStep < 1) setActiveStep(1);
          if (pct > 45 && activeStep < 2) setActiveStep(2);
          if (pct > 70 && activeStep < 3) setActiveStep(3);
          if (pct > 90 && activeStep < 4) setActiveStep(4);

          if (pct >= 100) {
            setRunning(false);
            setSimCompleted(true);
            setConsoleLogs((logs) => [
              ...logs,
              { time: new Date().toLocaleTimeString(), text: "[SIM-COMPLETE] Attack simulation run concluded. Incident INC-2026-0889 registered in SOC.", type: "success" },
            ]);
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [running, duration, intensity, activeStep]);

  function handleStartSimulation() {
    setConfirmOpen(false);
    setRunning(true);
    setProgress(0);
    setElapsed(0);
    setActiveStep(0);
    setSimCompleted(false);
    setReportExported(false);

    const now = new Date().toLocaleTimeString();
    setConsoleLogs([
      { time: now, text: `[INIT] Isolated Lab Mode engaged for target ${targetDevice}.`, type: "info" },
      { time: now, text: `[ATTACK-VECTOR] Scenario: ${attackVector} · Mode: ${attackMode} · Intensity: ${intensity}`, type: "warn" },
      { time: now, text: `[SIM-ENGINE] Generating synthetic ${attackMode} packet streams from ${sourceCount} isolated virtual sources...`, type: "warn" },
    ]);

    setTimeout(() => {
      setConsoleLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[DETECTION] Anomaly detected: MQTT connection rate exceeds baseline threshold (> 850 conn/s).`, type: "crit" },
      ]);
    }, 1500);

    setTimeout(() => {
      setConsoleLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[CASE-MEMORY] Matching historical case: CAS-041 (IoMT Gateway Flood) found with 96.4% confidence.`, type: "info" },
      ]);
    }, 3000);

    setTimeout(() => {
      setConsoleLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[BIOMED-SAFEGUARD] Validated target ${targetDevice} clinical priority tier: CRITICAL.`, type: "success" },
        { time: new Date().toLocaleTimeString(), text: `[RESPONSE] Enforcing safe rate-limit & client connection throttling without service drop.`, type: "success" },
      ]);
    }, 4500);
  }

  function handleExportReport() {
    setReportExported(true);
    const reportData = {
      simulationId: `SIM-LAB-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: attackMode,
      vector: attackVector,
      target: targetDevice,
      intensity,
      duration,
      sourceCount,
      runNote: runNote || "FYP Demo Run — MQTT scenario",
      status: simCompleted ? "Completed" : "Configured",
      metrics: {
        peakPacketRate: `${packetRate || 2240} pps`,
        peakBandwidth: `${bandwidth || 18.5} Mbps`,
        maxTargetLatency: `${targetLatency || 142.8} ms`,
      },
      preflightPassed: true,
      caseMemoryMatch: "CAS-041 (MQTT Connect Flood Mitigation)",
      safeguardDecision: "Safe Throttling Applied — 0 packet drops on clinical payload",
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medisoc-attack-sim-${targetDevice}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full overflow-y-auto bg-[#070908] text-white p-6 lg:p-8 font-sans">
      <div className="max-w-[1440px] mx-auto space-y-6">
        
        {/* Header matching prototype screenshot */}
        <div>
          <div className="text-[12px] font-mono font-bold tracking-widest text-[#A8FF35] uppercase mb-1">
            CONTROLLED ATTACK SIMULATION
          </div>
          <h1 className="text-[30px] lg:text-[34px] font-bold text-white tracking-tight">
            Isolated Lab Mode
          </h1>
        </div>

        {/* Top Grid: Simulation Parameters (Left) + Pre-flight Checklist (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Simulation Parameters Card */}
          <div className="lg:col-span-8 bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl">
            <h2 className="text-[17px] font-semibold text-white mb-6">
              Simulation Parameters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ATTACK MODE */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  ATTACK MODE
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#080B09] p-1 rounded-lg border border-[#1B261F]">
                  <button
                    type="button"
                    onClick={() => {
                      setAttackMode("DoS");
                      setSourceCount("1");
                    }}
                    className={`py-2.5 px-4 rounded-md font-bold text-[14px] transition-all ${
                      attackMode === "DoS"
                        ? "bg-[#A8FF35] text-black shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    DoS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttackMode("DDoS");
                      setSourceCount("32");
                    }}
                    className={`py-2.5 px-4 rounded-md font-bold text-[14px] transition-all ${
                      attackMode === "DDoS"
                        ? "bg-[#A8FF35] text-black shadow-md"
                        : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    DDoS
                  </button>
                </div>
              </div>

              {/* ATTACK VECTOR */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  ATTACK VECTOR
                </label>
                <select
                  value={attackVector}
                  onChange={(e) => setAttackVector(e.target.value)}
                  className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-3.5 py-2.5 text-[14px] text-white font-medium focus:outline-none focus:border-[#A8FF35] transition-colors"
                >
                  {vectors.map((v) => (
                    <option key={v.value} value={v.value} className="bg-[#0D120F] text-white">
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* TARGET DEVICE */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  TARGET DEVICE
                </label>
                <select
                  value={targetDevice}
                  onChange={(e) => setTargetDevice(e.target.value)}
                  className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-3.5 py-2.5 text-[14px] text-white font-medium focus:outline-none focus:border-[#A8FF35] transition-colors"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#0D120F] text-white">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* INTENSITY */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  INTENSITY
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#080B09] p-1 rounded-lg border border-[#1B261F]">
                  {(["Low", "Medium", "High"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIntensity(lvl)}
                      className={`py-2 px-2 text-center rounded-md text-[13px] font-bold transition-all ${
                        intensity === lvl
                          ? "bg-[#A8FF35] text-black shadow-md"
                          : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* DURATION */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  DURATION
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#080B09] p-1 rounded-lg border border-[#1B261F]">
                  {(["30 sec", "60 sec", "120 sec"] as const).map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDuration(dur)}
                      className={`py-2 px-2 text-center rounded-md text-[13px] font-bold transition-all ${
                        duration === dur
                          ? "bg-[#A8FF35] text-black shadow-md"
                          : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* SOURCE COUNT */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                  SOURCE COUNT
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={sourceCount}
                  onChange={(e) => setSourceCount(e.target.value)}
                  className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-3.5 py-2.5 text-[14px] text-white font-mono font-medium focus:outline-none focus:border-[#A8FF35] transition-colors"
                />
              </div>

            </div>

            {/* RUN NOTE (OPTIONAL) */}
            <div className="mt-6">
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                RUN NOTE (OPTIONAL)
              </label>
              <input
                type="text"
                value={runNote}
                onChange={(e) => setRunNote(e.target.value)}
                placeholder="e.g. FYP Demo Run — MQTT scenario"
                className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#A8FF35] transition-colors font-sans"
              />
            </div>

            {/* Action Buttons Row */}
            <div className="mt-8 flex flex-wrap items-center gap-4 pt-4 border-t border-[#1B261F]">
              <button
                type="button"
                disabled={running}
                onClick={() => setConfirmOpen(true)}
                className={`px-6 py-3 rounded-lg text-[14px] font-extrabold flex items-center gap-2.5 transition-all shadow-lg active:scale-95 ${
                  running
                    ? "bg-red-900/50 text-red-300 border border-red-700/50 cursor-not-allowed"
                    : "bg-[#FF4D4D] hover:bg-[#ff6161] text-white shadow-red-950/40 hover:shadow-red-900/60"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />
                </svg>
                <span>{running ? "Simulation in Progress..." : "Start Controlled Simulation"}</span>
              </button>

              <button
                type="button"
                onClick={handleExportReport}
                className="px-5 py-3 rounded-lg bg-[#14261C] border border-[#21422E] text-[#A8FF35] hover:bg-[#1C3627] hover:border-[#2D5A3F] text-[14px] font-bold flex items-center gap-2 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{reportExported ? "Attack Report Exported ✓" : "Export Attack Report"}</span>
              </button>

              {simCompleted && (
                <button
                  type="button"
                  onClick={() => onNavigate("incidents")}
                  className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[13px] font-semibold flex items-center gap-1.5 ml-auto"
                >
                  <span>Review in Incidents →</span>
                </button>
              )}
            </div>

            {/* Live Progress bar if running */}
            {running && (
              <div className="mt-6 pt-4 border-t border-[#1B261F] animate-in fade-in">
                <div className="flex items-center justify-between text-[13px] font-mono mb-2">
                  <span className="text-[#A8FF35] font-bold">SIMULATION EXECUTING: {progress}%</span>
                  <span className="text-white/60">{elapsed}s / {duration}</span>
                </div>
                <div className="w-full h-2.5 bg-[#080B09] rounded-full overflow-hidden border border-[#1B261F]">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-[#A8FF35] transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {/* Live Real-time stats */}
                <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                  <div className="p-2.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                    <div className="text-[11px] text-white/50 uppercase font-mono">Packet Rate</div>
                    <div className="text-[16px] font-bold text-yellow-400 font-mono">{packetRate} pps</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                    <div className="text-[11px] text-white/50 uppercase font-mono">Bandwidth</div>
                    <div className="text-[16px] font-bold text-[#A8FF35] font-mono">{bandwidth} Mbps</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                    <div className="text-[11px] text-white/50 uppercase font-mono">Target RTT</div>
                    <div className="text-[16px] font-bold text-red-400 font-mono">{targetLatency} ms</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Pre-flight Checklist Card */}
          <div className="lg:col-span-4 bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-white mb-6">
                Pre-flight Checklist
              </h2>

              <ul className="space-y-4">
                {checklist.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[14px]">
                    <span className="text-[#A8FF35] font-bold text-[15px]">✓</span>
                    <span className="text-white/90 font-medium">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety notice banner */}
            <div className="mt-8 p-4 rounded-lg bg-[#080B09] border border-[#1B261F]/80">
              <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#A8FF35] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#A8FF35] animate-pulse" />
                SAFEGUARD ACTIVE
              </div>
              <p className="text-[12px] text-white/65 leading-relaxed">
                IoMT sandboxing prevents disruption to critical clinical patient networks. All flows are constrained to the isolated virtual testbed.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Card: Investigation Path (matching screenshot) */}
        <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[17px] font-semibold text-white">
                Investigation Path
              </h2>
              <p className="text-[13px] text-white/60 font-mono mt-0.5">
                Simulated case traversal · PARTIAL route selected by controller
              </p>
            </div>

            {/* Legend matching prototype */}
            <div className="flex items-center gap-5 text-[12px] font-mono">
              <div className="flex items-center gap-2">
                <span className="w-5 h-[2px] bg-[#A8FF35] inline-block" />
                <span className="text-white/80">Active path</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-[2px] border-t border-dashed border-white/40 inline-block" />
                <span className="text-white/50">Alternate</span>
              </div>
            </div>
          </div>

          {/* Node Diagram Traversal Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            
            {/* Step 1: Detection Phase */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeStep >= 1 ? "bg-[#111A14] border-[#A8FF35]/60 shadow-[0_0_15px_rgba(168,255,53,0.15)]" : "bg-[#080B09] border-[#1B261F]"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#A8FF35] font-bold mb-1">
                PHASE 01
              </div>
              <div className="text-[14px] font-bold text-white mb-2">
                DETECTION PHASE
              </div>
              <div className="space-y-1 text-[12px] text-white/70 font-mono">
                <div>• Packet Ingestion: OK</div>
                <div>• Feature Vector: Extracted</div>
                <div>• Anomaly Model: <span className="text-[#A8FF35]">98.4%</span></div>
              </div>
            </div>

            {/* Step 2: Routing & Classification */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeStep >= 2 ? "bg-[#111A14] border-[#A8FF35]/60 shadow-[0_0_15px_rgba(168,255,53,0.15)]" : "bg-[#080B09] border-[#1B261F]"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#A8FF35] font-bold mb-1">
                PHASE 02
              </div>
              <div className="text-[14px] font-bold text-white mb-2">
                ROUTING & CBR MATCH
              </div>
              <div className="space-y-1 text-[12px] text-white/70 font-mono">
                <div>• Case Retrieval: CAS-041</div>
                <div>• Vector Sim: 0.964</div>
                <div>• Confidence: HIGH</div>
              </div>
            </div>

            {/* Step 3: BioMed Safe Verification */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeStep >= 3 ? "bg-[#111A14] border-[#A8FF35]/60 shadow-[0_0_15px_rgba(168,255,53,0.15)]" : "bg-[#080B09] border-[#1B261F]"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#A8FF35] font-bold mb-1">
                PHASE 03
              </div>
              <div className="text-[14px] font-bold text-white mb-2">
                BIOMED SAFEGUARD
              </div>
              <div className="space-y-1 text-[12px] text-white/70 font-mono">
                <div>• Target: {targetDevice}</div>
                <div>• Criticality: Tier-1 (Life)</div>
                <div>• Action: Non-Disruptive</div>
              </div>
            </div>

            {/* Step 4: Mitigation & Containment */}
            <div className={`p-4 rounded-xl border transition-all ${
              activeStep >= 4 ? "bg-[#111A14] border-[#A8FF35]/60 shadow-[0_0_15px_rgba(168,255,53,0.15)]" : "bg-[#080B09] border-[#1B261F]"
            }`}>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#A8FF35] font-bold mb-1">
                PHASE 04
              </div>
              <div className="text-[14px] font-bold text-white mb-2">
                CONTAINMENT APPLIED
              </div>
              <div className="space-y-1 text-[12px] text-white/70 font-mono">
                <div>• Dynamic ACL: Enforced</div>
                <div>• Traffic Scrubbed: 100%</div>
                <div>• Telemetry: Restored</div>
              </div>
            </div>

          </div>

          {/* Console Log Output */}
          <div className="mt-6 rounded-lg border border-[#1B261F] overflow-hidden bg-[#050706]">
            <div className="px-4 py-2 border-b border-[#1B261F] bg-[#0A0E0C] flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase font-mono text-white/60">
                Simulation Engine Console Output
              </span>
              {running && (
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#A8FF35]">
                  <span className="w-2 h-2 rounded-full bg-[#A8FF35] animate-ping" />
                  LIVE TRAFFIC STREAM
                </span>
              )}
            </div>
            <div className="p-4 h-[160px] overflow-y-auto font-mono text-[13px] space-y-1.5">
              {consoleLogs.length === 0 ? (
                <div className="text-white/30 italic">
                  Awaiting attack simulation execution. Select your parameters and click "Start Controlled Simulation" above.
                </div>
              ) : (
                consoleLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-white/40 shrink-0">[{log.time}]</span>
                    <span
                      className={
                        log.type === "crit"
                          ? "text-[#FF5555] font-bold"
                          : log.type === "warn"
                          ? "text-yellow-400"
                          : log.type === "success"
                          ? "text-[#A8FF35] font-bold"
                          : "text-white/80"
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Confirmation Modal */}
        <ConfirmDialog
          open={confirmOpen}
          title="Start Controlled Attack Simulation"
          variant="warning"
          confirmLabel="Execute Attack"
          cancelLabel="Cancel"
          description={`Are you sure you want to execute the ${attackVector} (${attackMode}) simulation on target device ${targetDevice}? Synthetic test traffic will be routed through the isolated lab environment.`}
          onConfirm={handleStartSimulation}
          onCancel={() => setConfirmOpen(false)}
        />

      </div>
    </div>
  );
}

```


################################################################################
### FILE 36/54: `src/screens/AuditLog.tsx`
################################################################################

```tsx
import React from "react";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";

interface Props { onNavigate: (s: Screen) => void; }

const MOCK_AUDIT = [
  { id: "A-1029", time: "2024-10-10 14:05:10", actor: "admin@iomt-testbed.local", action: "AUTHORIZE_RESPONSE", target: "Gateway-01", status: "SUCCESS" },
  { id: "A-1028", time: "2024-10-10 14:02:40", actor: "system", action: "CREATE_INCIDENT", target: "INC-104", status: "SUCCESS" },
  { id: "A-1027", time: "2024-10-10 10:15:00", actor: "analyst1@iomt-testbed.local", action: "ACKNOWLEDGE_INCIDENT", target: "INC-103", status: "SUCCESS" },
  { id: "A-1026", time: "2024-10-09 16:30:12", actor: "system", action: "UPDATE_BASELINE", target: "Infusion-Pump-A", status: "SUCCESS" },
  { id: "A-1025", time: "2024-10-09 09:12:05", actor: "admin@iomt-testbed.local", action: "USER_LOGIN", target: "Session", status: "SUCCESS" },
];

export default function AuditLog({ onNavigate }: Props) {
  const { user } = useAuth();
  
  if (user?.role !== "admin") {
     return (
        <div className="h-full flex items-center justify-center p-6 text-center">
           <div>
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(245,56,56,0.1)", color: "#F53838" }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                 </svg>
              </div>
              <h2 className="text-[18px] font-bold mb-2">Access Denied</h2>
              <p className="text-[13px] text-[var(--text-3)] max-w-[300px]">
                 The Audit Log is restricted to administrative users.
              </p>
           </div>
        </div>
     );
  }

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "var(--text)" }}>Audit Log</h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
               Immutable record of system and user actions.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm">Export Log</button>
        </div>
        
        <div className="alert-info text-[13px] mb-6">
           <strong>DEMONSTRATION LOG</strong> — This is an in-memory mock log for the frontend prototype. It is not persistent.
        </div>

        <div className="card overflow-hidden">
           <table className="data-table">
              <thead>
                 <tr>
                    <th>Log ID</th>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Status</th>
                 </tr>
              </thead>
              <tbody>
                 {MOCK_AUDIT.map(a => (
                    <tr key={a.id}>
                       <td className="mono">{a.id}</td>
                       <td className="mono">{a.time}</td>
                       <td className="mono">{a.actor}</td>
                       <td className="font-semibold" style={{ color: "var(--text-2)" }}>{a.action}</td>
                       <td className="mono">{a.target}</td>
                       <td>
                          <span className="badge" style={{ background: a.status === "SUCCESS" ? "rgba(28,201,112,0.1)" : "rgba(245,56,56,0.1)", color: a.status === "SUCCESS" ? "#1CC970" : "#F53838" }}>
                             {a.status}
                          </span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 37/54: `src/screens/CaseDetail.tsx`
################################################################################

```tsx
import React from "react";
import Card from "../components/ui/Card";
import { OutcomeBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

const reuseHistory = [
  { date: "2026-09-05 14:02", incident: "INC-104", outcome: "SUCCESS", adapted: true },
  { date: "2026-09-04 09:18", incident: "INC-097", outcome: "SUCCESS", adapted: false },
  { date: "2026-09-03 16:45", incident: "INC-091", outcome: "PARTIAL", adapted: true },
  { date: "2026-09-02 11:30", incident: "INC-085", outcome: "SUCCESS", adapted: false },
];

export default function CaseDetail({ onNavigate }: Props) {
  const reliability = 84;
  const successCount = 10;
  const partialCount = 1;
  const failureCount = 1;
  const total = 12;

  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">
        <div className="flex items-start justify-between mb-7">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[40px] font-bold mono text-[#A78BFA]">CASE-128</span>
              <OutcomeBadge value="SUCCESS"/>
            </div>
            <div className="text-[19px] text-[#94A8BA]">MQTT DDoS · Gateway — Critical · Validated Experience Record</div>
          </div>
          <Button variant="secondary" className="text-[15px] py-2" onClick={() => onNavigate("case-memory")}>← Case Memory</Button>
        </div>

        <div className="grid grid-cols-[1fr_340px] gap-6">
          <div className="space-y-5">
            <Card className="p-5">
              <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Case Summary</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Attack Vector", value: "MQTT Connect Flood" },
                  { label: "Attack Mode", value: "DDoS" },
                  { label: "Device Type", value: "Patient Monitor Gateway" },
                  { label: "Device Criticality", value: "Critical" },
                  { label: "Recommended Response", value: "Rate Limiting + Source Block" },
                  { label: "Executed Response", value: "MQTT Rate Limiting (120s)" },
                  { label: "Outcome", value: "SUCCESS" },
                  { label: "Containment Time", value: "14 seconds" },
                ].map(r => (
                  <div key={r.label} className="py-2 border-b border-[#1A1F1B]">
                    <div className="text-[13px] text-[#94A8BA] uppercase tracking-widest mb-0.5">{r.label}</div>
                    <div className="text-[19px] font-medium mono text-[#E8EDE9]">{r.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Reliability Evidence</div>
              <div className="flex items-end gap-1.5 mb-4" style={{ height: 80 }}>
                {Array.from({ length: total }, (_, i) => {
                  const h = i < successCount ? 75 : i < successCount + partialCount ? 45 : 20;
                  const color = i < successCount ? "#B6FF3B" : i < successCount + partialCount ? "#F59E0B" : "#EF4444";
                  return <div key={i} className="flex-1 rounded-t-[3px]" style={{ height: h, background: color }}/>;
                })}
              </div>
              <div className="flex items-center gap-4 text-[15px] mb-3">
                {[
                  { label: `Success (${successCount})`, color: "#B6FF3B" },
                  { label: `Partial (${partialCount})`, color: "#F59E0B" },
                  { label: `Failure (${failureCount})`, color: "#EF4444" },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded-sm inline-block" style={{ background: l.color }}/>
                    <span className="text-[#94A8BA]">{l.label}</span>
                  </span>
                ))}
              </div>
              <div className="pt-3 border-t border-[#1A1F1B]">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[15px] text-[#94A8BA]">Historical Reliability</span>
                  <span className="text-[24px] font-bold mono text-[#E8EDE9]">{reliability}%</span>
                </div>
                <div className="w-full bg-[#1A1F1B] rounded-full h-2">
                  <div className="h-2 rounded-full bg-[#B6FF3B]" style={{ width: `${reliability}%` }}/>
                </div>
                <div className="text-[13px] text-[#94A8BA] mt-1">Based on {total} validated attempts · evidence-bounded estimate</div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="text-[19px] font-semibold text-[#E8EDE9] mb-4">Reuse History</div>
              <div className="space-y-0">
                {reuseHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-[#1A1F1B] last:border-0">
                    <div className="w-1.5 self-stretch flex flex-col items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7C6FF0] mt-1 shrink-0"/>
                      {i < reuseHistory.length - 1 && <div className="flex-1 w-px bg-[#1A1F1B] mt-1"/>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium mono text-[15px] text-[#E8EDE9]">{h.incident}</span>
                        <OutcomeBadge value={h.outcome}/>
                        {h.adapted && <span className="text-[13px] text-[#A78BFA] bg-[#1E1A3D] border border-[#3B3570] px-2 py-0.5 rounded-full">Adapted</span>}
                      </div>
                      <div className="text-[13px] mono text-[#94A8BA]">{h.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card dark className="p-5">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-4">Validation Metrics</div>
              {[
                { label: "Validated Attempts", value: `${total}`, color: "#E8EDE9" },
                { label: "Successful", value: `${successCount}`, color: "#B6FF3B" },
                { label: "Partial", value: `${partialCount}`, color: "#F59E0B" },
                { label: "Failure", value: `${failureCount}`, color: "#EF4444" },
                { label: "Harmful", value: "0", color: "#94A8BA" },
                { label: "Historical Reliability", value: `${reliability}%`, color: "#B6FF3B" },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2 border-b border-[#161B17] last:border-0">
                  <span className="text-[15px] text-[#94A8BA]">{r.label}</span>
                  <span className="text-[15px] mono font-bold" style={{ color: r.color }}>{r.value}</span>
                </div>
              ))}
            </Card>

            <Card className="p-4">
              <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest mb-3">Context Tags</div>
              <div className="flex flex-wrap gap-2">
                {["MQTT", "DDoS", "Gateway", "Critical", "Rate Limiting", "Multi-Source"].map(t => (
                  <span key={t} className="px-2 py-1 text-[13px] font-medium bg-[#1A1F1B] border border-[#242924] rounded-full text-[#94A8BA]">{t}</span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 38/54: `src/screens/CaseMemory.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { cases } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

const TOTAL = 128;
const COUNTS = { success: 104, partial: 18, failed: 5, harmful: 1 };

// Week-by-week harmful+failed combined (4 weeks, current = last value)
const TREND_FAILED  = [8, 7, 6, 5];   // failed cases per week
const TREND_HARMFUL = [0, 1, 0, 1];   // harmful cases per week

function TrendSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = 0;
  const w = 40, h = 14;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / (max - min)) * (h - 2) - 1}`).join(" ");
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const down = last <= prev;
  return (
    <div className="flex items-center gap-1.5">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
        <polyline points={pts} stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" fill="none"/>
        <circle cx={(data.length - 1) * step} cy={h - ((last - min) / (max - min)) * (h - 2) - 1} r="1.8" fill={color}/>
      </svg>
      <span className="text-[11px] mono" style={{ color: down ? "#4A6A4A" : "#C06060" }}>
        {down ? "↓" : "↑"} wk
      </span>
    </div>
  );
}

// CBR retrieve-and-reuse icon: stacked records + retrieval arrow loop
function CBRIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="11.5" width="10" height="2.2" rx="0.7" stroke="#94A8BA" strokeWidth="1"/>
      <rect x="2" y="8"   width="10" height="2.2" rx="0.7" stroke="#94A8BA" strokeWidth="1"/>
      <rect x="2" y="4.5" width="10" height="2.2" rx="0.7" stroke="#94A8BA" strokeWidth="1"/>
      <circle cx="4.8" cy="5.6" r="0.65" fill="#94A8BA"/>
      <path d="M13 9.5C15.5 9.5 16 8 16 6.5C16 5 15.5 3.5 13 3.5" stroke="#94A8BA" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M13.2 3.5L11.5 2.5M13.2 3.5L11.5 4.5" stroke="#94A8BA" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Status bar with minimum segment width so failed/harmful are always visible
function StatusBar() {
  const segs = [
    { key: "success", count: COUNTS.success, color: "#243024", label: "Resolved",  textColor: "#94A8BA", alert: false },
    { key: "partial", count: COUNTS.partial,  color: "#5C2E08", label: "Partial",   textColor: "#94A8BA", alert: false },
    { key: "failed",  count: COUNTS.failed,   color: "#7F1D1D", label: "Failed",    textColor: "#F87171", alert: true  },
    { key: "harmful", count: COUNTS.harmful,  color: "#EF4444", label: "Harmful",   textColor: "#EF4444", alert: true  },
  ];
  const MIN_PCT = 7;
  const extra = 100 - segs.length * MIN_PCT;
  const widths = segs.map(s => MIN_PCT + (s.count / TOTAL) * extra);

  return (
    <div>
      {/* Bar */}
      <div className="flex h-[7px] rounded-full overflow-hidden gap-[2px] w-full mb-3">
        {segs.map((s, i) => (
          <div key={s.key} style={{ width: `${widths[i]}%`, background: s.color, borderRadius: 2 }} />
        ))}
      </div>

      {/* Integrated legend + alert cells — connected to bar by top border color */}
      <div className="grid grid-cols-4 gap-1.5">
        {segs.map(s => (
          <div
            key={s.key}
            className="px-3 pt-2.5 pb-2 rounded-[6px]"
            style={{
              borderTop: `2px solid ${s.color}`,
              background: s.alert ? (s.key === "harmful" ? "#150808" : "#120505") : "transparent",
            }}
          >
            <div className="flex items-start justify-between mb-0.5">
              <div className="text-[11px] mono uppercase tracking-widest" style={{ color: s.alert ? s.textColor : "#94A8BA" }}>
                {s.label}
              </div>
              {s.key === "failed"  && <TrendSparkline data={TREND_FAILED}  color="#C06060" />}
              {s.key === "harmful" && <TrendSparkline data={TREND_HARMFUL} color="#EF4444" />}
            </div>
            <div className="text-[26px] font-bold leading-none" style={{ color: s.alert ? s.textColor : "#C8CEC8" }}>
              {s.count}
            </div>
            <div className="text-[11px] text-[#94A8BA] mt-0.5">
              {((s.count / TOTAL) * 100).toFixed(s.count < 10 ? 1 : 0)}% of {TOTAL}
            </div>
            {s.alert && (
              <div className="text-[11px] mt-1" style={{ color: s.key === "harmful" ? "#8A4040" : "#7A3030" }}>
                {s.key === "harmful" ? "caused adverse effect" : "no containment"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function responseComplexity(r: string): "multi" | "single" {
  return r.includes("+") ? "multi" : "single";
}

function OutcomeDisplay({ outcome, response }: { outcome: string; response: string }) {
  const cl = responseComplexity(response) === "multi" ? "multi-step negotiation" : "single-tool action";
  if (outcome === "SUCCESS") return (
    <div>
      <div className="text-[15px] text-[#94A8BA]">Resolved</div>
      <div className="text-[13px] text-[#94A8BA] mt-0.5">{cl}</div>
    </div>
  );
  if (outcome === "PARTIAL") return (
    <div>
      <div className="text-[15px] text-[#D97706]">Partial containment</div>
      <div className="text-[13px] text-[#94A8BA] mt-0.5">{cl}</div>
    </div>
  );
  return <div className="text-[15px] text-[#EF4444] font-medium">Failed</div>;
}

function TrustCell({ uses, reliability }: { uses: number; reliability: number }) {
  const tier = reliability >= 88 ? { label: "HIGH", color: "#94A8BA" }
    : reliability >= 75 ? { label: "MED", color: "#D97706" }
    : { label: "LOW", color: "#EF4444" };
  const filled = Math.round((uses / 16) * reliability / 100 * 16);
  return (
    <div className="flex items-start gap-3">
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-[18px] font-semibold text-[#C8CEC8]">{uses}</span>
          <span className="text-[13px] text-[#94A8BA]">× verified</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[13px] font-medium" style={{ color: tier.color }}>{tier.label}</span>
          <span className="text-[13px] text-[#94A8BA]">· {reliability}%</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-[3px] max-w-[30px] mt-0.5">
        {Array.from({ length: Math.min(uses, 12) }).map((_, i) => (
          <div key={i} className="w-[5px] h-[5px] rounded-full"
            style={{ background: i < filled ? "#2E3B2E" : "#1A1E1B" }}/>
        ))}
      </div>
    </div>
  );
}

export default function CaseMemory({ onNavigate }: Props) {
  const [showHow, setShowHow] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-[#0C0F0D]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 fade-in">

        {/* ─── CBR Memory Header ─── */}
        <div className="bg-[#0D100D] border border-[#1A1E1B] rounded-[14px] p-6 mb-6">

          {/* Top row: identity + key metrics */}
          <div className="flex items-start justify-between mb-5">
            {/* Left: title + info toggle */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] bg-[#1A1E1B] border border-[#242924] flex items-center justify-center shrink-0">
                <CBRIcon />
              </div>
              <div>
                <div className="text-[11px] text-[#94A8BA] uppercase tracking-widest mb-0.5 mono">Case-Based Reasoning Memory</div>
                <div className="text-[19px] font-semibold text-[#E8EDE9]">Case Memory Bank</div>
              </div>
              <button
                onClick={() => setShowHow(v => !v)}
                title="How CBR retrieval works"
                className="ml-1 flex items-center gap-1 px-2 py-1 rounded-[5px] border border-[#1A1E1B] text-[#94A8BA] hover:text-[#C8CEC8] hover:border-[#2E342E] transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1"/>
                  <path d="M5.5 5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="5.5" cy="3.3" r="0.55" fill="currentColor"/>
                </svg>
                <span className="text-[12px] mono">how this works</span>
              </button>
            </div>

            {/* Right: total + resolution rate */}
            <div className="text-right">
              <div className="text-[44px] font-bold text-[#E8EDE9] leading-none tracking-tight">128</div>
              <div className="text-[13px] text-[#94A8BA] mt-1">validated cases in memory</div>
              <div className="flex items-center justify-end gap-2 mt-1.5">
                <span className="text-[20px] font-semibold text-[#E8EDE9]">81.3%</span>
                <span className="text-[13px] text-[#94A8BA]">full resolution rate</span>
                <span className="text-[11px] mono text-[#94A8BA] bg-[#1A1E1B] border border-[#242924] px-1.5 py-0.5 rounded-[4px]">resolved ÷ total</span>
              </div>
            </div>
          </div>

          {/* Collapsible explanation */}
          {showHow && (
            <div className="mb-5 px-4 py-3 bg-[#111411] border border-[#1A1E1B] rounded-[8px]">
              <p className="text-[14px] text-[#94A8BA] leading-relaxed max-w-[720px]">
                When a new attack arrives, the controller retrieves the most similar past case by comparing attack type, device context, and severity. If the match confidence exceeds threshold, the stored response is reused directly — bypassing full agent investigation and cutting median TTC from ~60 s to ~14 s. Cases accumulate with each resolved incident and are weighted by outcome reliability over time.
              </p>
            </div>
          )}

          {/* Integrated status bar + legend + alert cells */}
          <StatusBar />
        </div>

        {/* ─── Table label ─── */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] mono text-[#94A8BA] uppercase tracking-widest">Validated Case Records — most recently activated first</div>
          <div className="text-[13px] text-[#94A8BA]">Click a row to inspect match evidence and reuse history</div>
        </div>

        {/* ─── Case Table ─── */}
        <div className="bg-[#0D100D] border border-[#1A1E1B] rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1E1B]">
                {[
                  ["Case ID", "w-[130px]"],
                  ["Attack Vector", ""],
                  ["Device Context", ""],
                  ["Response Action", ""],
                  ["Outcome", "w-[160px]"],
                  ["Trust", "w-[180px]"],
                ].map(([h, cls]) => (
                  <th key={h} className={`text-left px-5 py-3.5 text-[13px] font-medium text-[#94A8BA] uppercase tracking-widest ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cases.map((c, idx) => (
                <tr
                  key={c.id}
                  className="border-b border-[#131613] hover:bg-[#111411] cursor-pointer transition-colors group"
                  onClick={() => onNavigate("case-detail")}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[3px] h-7 rounded-full bg-[#1E241E] group-hover:bg-[#2E362E] transition-colors shrink-0"/>
                      <div>
                        <div className="text-[14px] mono font-semibold text-[#9D8BF4] group-hover:text-[#B8ABFA] transition-colors">{c.id}</div>
                        <div className="text-[12px] text-[#94A8BA] mt-0.5">entry {TOTAL - idx}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[15px] text-[#C0C7C0] font-medium">{c.attack}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[14px] text-[#94A8BA]">{c.device}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[14px] text-[#A8B0A8]">{c.response}</div>
                    <div className="mt-1.5">
                      {responseComplexity(c.response) === "multi" ? (
                        <span className="text-[12px] text-[#94A8BA] bg-[#181C18] border border-[#242924] px-1.5 py-0.5 rounded-sm">multi-step</span>
                      ) : (
                        <span className="text-[12px] text-[#94A8BA] bg-[#131613] border border-[#1A1E1B] px-1.5 py-0.5 rounded-sm">single-tool</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <OutcomeDisplay outcome={c.outcome} response={c.response}/>
                  </td>
                  <td className="px-5 py-4">
                    <TrustCell uses={c.uses} reliability={c.reliability}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 text-[13px] mono text-[#94A8BA] text-center">
          Showing {cases.length} of {TOTAL} cases · trust = validated-uses × outcome-weighted reliability · sorted by last activation
        </div>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 39/54: `src/screens/Dashboard.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from "recharts";
import { trafficData, incidents, services, alertTrendData, attackTypeData } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

/* ── Severity helpers ─────────────────────────────────────────────── */
function sevColor(crit: string) {
  if (crit === "Critical") return { bg: "rgba(245,56,56,0.12)", text: "#F87171", bar: "#F53838", border: "rgba(245,56,56,0.3)" };
  if (crit === "High")     return { bg: "rgba(232,101,12,0.12)", text: "#FB923C", bar: "#E8650C", border: "rgba(232,101,12,0.3)" };
  if (crit === "Medium")   return { bg: "rgba(232,194,12,0.1)", text: "#FBBF24", bar: "#E8C20C", border: "rgba(232,194,12,0.25)" };
  return                          { bg: "rgba(12,184,107,0.1)",  text: "#4ADE80", bar: "#0CB86B", border: "rgba(12,184,107,0.25)" };
}

function outcomeLabel(o: string) {
  if (o === "SUCCESS") return { label: "Resolved", color: "#1CC970" };
  if (o === "PARTIAL") return { label: "Partial",  color: "#F0A020" };
  if (o === "FAILURE") return { label: "Failed",   color: "#F53838" };
  return                     { label: o,           color: "#8EA5B0" };
}

function statusPill(s: string) {
  if (s === "Investigating") return { label: "Investigating", bg: "rgba(245,56,56,0.12)", color: "#F87171" };
  if (s === "Escalated")     return { label: "Escalated",     bg: "rgba(240,160,32,0.12)", color: "#F0A020" };
  if (s === "Resolved")      return { label: "Resolved",      bg: "rgba(28,201,112,0.1)",  color: "#1CC970" };
  return                            { label: s,               bg: "rgba(78,130,160,0.1)", color: "#8EA5B0" };
}

/* ── KPI Card ─────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, accent, warn, ok, onClick
}: {
  label: string; value: string; sub: string;
  accent?: boolean; warn?: boolean; ok?: boolean;
  onClick?: () => void;
}) {
  const valueColor = accent ? "#F87171" : warn ? "#F0A020" : ok ? "#1CC970" : "var(--text)";
  return (
    <div
      className="kpi-card cursor-pointer hover:border-[var(--border-2)] transition-all"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: valueColor, fontSize: "26px" }}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

/* ── Chart tooltip ────────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-[12px] rounded-[8px] px-3 py-2.5 shadow-xl"
      style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", fontFamily: "JetBrains Mono, monospace" }}
    >
      <div className="mb-1.5" style={{ color: "var(--text-3)" }}>T+{label}s</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: "var(--text-2)" }}>{p.dataKey}</span>
          </div>
          <span style={{ color: "var(--text)" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-[12px] rounded-[8px] px-3 py-2.5 shadow-xl"
      style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)", fontFamily: "JetBrains Mono, monospace" }}
    >
      <div className="mb-1.5 font-semibold" style={{ color: "var(--text-2)" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            <span className="capitalize" style={{ color: "var(--text-3)" }}>{p.dataKey}</span>
          </div>
          <span style={{ color: "var(--text)" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Section header ───────────────────────────────────────────────── */
function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{title}</h2>
      {action && (
        <button
          onClick={onAction}
          className="text-[12px] transition-colors"
          style={{ color: "var(--text-3)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
        >
          {action} →
        </button>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */
export default function Dashboard({ onNavigate }: Props) {
  const [hoveredInc, setHoveredInc] = useState<string | null>(null);

  const activeIncidents = incidents.filter(i => i.status === "Investigating" || i.status === "Escalated");
  const criticalCount = incidents.filter(i => i.criticality === "Critical").length;
  const resolvedCount = incidents.filter(i => i.status === "Resolved").length;

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="px-6 py-5 max-w-[1600px] mx-auto">

        {/* ── Active incident critical banner ──────────────────────── */}
        <div
          className="flex items-center gap-4 px-4 py-3 mb-5 rounded-[8px] cursor-pointer transition-all"
          style={{
            background: "rgba(245,56,56,0.07)",
            border: "1px solid rgba(245,56,56,0.25)",
            borderLeft: "3px solid var(--critical)",
          }}
          onClick={() => onNavigate("incident-overview")}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,56,56,0.11)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(245,56,56,0.07)")}
        >
          <span className="w-2 h-2 rounded-full pulse-critical flex-shrink-0" style={{ background: "var(--critical)" }} />
          <span className="text-[12px] font-bold mono uppercase tracking-widest" style={{ color: "var(--critical)" }}>
            Active Critical Incident
          </span>
          <span className="text-[13px]" style={{ color: "#D08080" }}>
            INC-104 · DDoS MQTT Connect Flood · Gateway-01 (Patient Monitor Gateway)
          </span>
          <span className="ml-auto text-[12px] mono flex items-center gap-1.5 shrink-0" style={{ color: "var(--text-3)" }}>
            Investigating · 00:18 elapsed
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3.5 2l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <KpiCard
            label="Active Incidents"
            value={String(activeIncidents.length)}
            sub="2 critical · 1 escalated"
            accent
            onClick={() => onNavigate("incidents")}
          />
          <KpiCard
            label="Critical Devices"
            value="1"
            sub="Gateway-01 at risk"
            warn
            onClick={() => onNavigate("devices")}
          />
          <KpiCard
            label="Detector F1 Score"
            value="0.957"
            sub="XGBoost-v3 · in-domain test"
            ok
          />
          <KpiCard
            label="Containment Rate"
            value="87.5%"
            sub="7 / 8 recent incidents"
            ok
          />
        </div>

        {/* ── Main grid ────────────────────────────────────────────── */}
        <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 340px" }}>

          {/* Traffic chart */}
          <div className="card p-0 overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <span className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>
                  Network Traffic · Gateway-01
                </span>
                <span className="ml-2.5 text-[11px] mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>
                  msg/sec · 60s window
                </span>
              </div>
              <div className="flex items-center gap-4 text-[12px] mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--critical)" }} />
                  <span style={{ color: "var(--text-3)" }}>Malicious</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--lime)" }} />
                  <span style={{ color: "var(--text-3)" }}>Legitimate</span>
                </span>
                <span
                  className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: "rgba(139,114,240,0.1)", color: "#8B72F0", border: "1px solid rgba(139,114,240,0.2)" }}
                >
                  Demo data
                </span>
              </div>
            </div>
            <div className="px-5 py-4">
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="malGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F53838" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#F53838" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="legGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A8FF35" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#A8FF35" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine x={15} stroke="#F53838" strokeWidth={1} strokeOpacity={0.5} label={{ value: "ATTACK", position: "insideTopRight", fontSize: 10, fontFamily: "JetBrains Mono", fill: "#F53838", fontWeight: 700 }} />
                    <ReferenceLine x={38} stroke="#1CC970" strokeWidth={1} strokeOpacity={0.5} label={{ value: "RESPONSE", position: "insideTopRight", fontSize: 10, fontFamily: "JetBrains Mono", fill: "#1CC970", fontWeight: 700 }} />
                    <Area type="monotone" dataKey="malicious" stroke="#F53838" strokeWidth={1.5} fill="url(#malGrad)" dot={false} />
                    <Area type="monotone" dataKey="legit" stroke="#A8FF35" strokeWidth={1.5} fill="url(#legGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active incident panel */}
          <div
            className="card overflow-hidden flex flex-col"
            style={{
              borderLeft: "3px solid var(--critical)",
              background: "rgba(245,56,56,0.03)",
            }}
          >
            <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full pulse-critical" style={{ background: "var(--critical)" }} />
                <span className="text-[10px] font-bold mono uppercase tracking-widest" style={{ color: "var(--critical)" }}>
                  Active Incident
                </span>
              </div>
              <div className="mono text-[26px] font-bold leading-none" style={{ color: "var(--text)" }}>INC-104</div>
              <div className="text-[14px] mt-1 font-medium" style={{ color: "#C87070" }}>
                DDoS · MQTT Connect Flood
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>
                Gateway-01 (Patient Monitor Gateway)
              </div>
            </div>

            <div className="flex-1 px-4 py-3 flex flex-col gap-0">
              {[
                { label: "Criticality",  value: "Critical",     color: "#F87171" },
                { label: "Status",       value: "Investigating", color: "#F87171" },
                { label: "Confidence",   value: "97%",          color: "#1CC970" },
                { label: "Route",        value: "PARTIAL",      color: "#F0A020" },
                { label: "Elapsed",      value: "00:18",        color: "var(--text-2)" },
              ].map(r => (
                <div
                  key={r.label}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{r.label}</span>
                  <span className="text-[13px] font-semibold mono" style={{ color: r.color }}>{r.value}</span>
                </div>
              ))}

              {/* Stage progress */}
              <div className="py-2.5">
                <div className="text-[10px] mono uppercase tracking-widest mb-2" style={{ color: "var(--text-3)" }}>
                  Stage
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {["Detect", "Route", "Investigate", "Respond", "Validate"].map((s, i) => (
                    <React.Fragment key={s}>
                      <div
                        className="text-[10px] mono uppercase px-1.5 py-0.5 rounded-[3px]"
                        style={{
                          background: i < 2 ? "rgba(28,201,112,0.15)" : i === 2 ? "rgba(245,56,56,0.15)" : "var(--surface-3)",
                          color: i < 2 ? "#1CC970" : i === 2 ? "#F87171" : "var(--text-4)",
                          border: i === 2 ? "1px solid rgba(245,56,56,0.3)" : "1px solid transparent",
                        }}
                      >
                        {s}
                      </div>
                      {i < 4 && <div className="w-1.5 h-px" style={{ background: i < 1 ? "#1CC970" : "var(--border)" }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={() => onNavigate("incident-overview")}
                className="w-full py-2 text-[13px] font-semibold mono uppercase tracking-widest transition-all rounded-[7px]"
                style={{ color: "var(--critical)", border: "1px solid rgba(245,56,56,0.3)", background: "rgba(245,56,56,0.08)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,56,56,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(245,56,56,0.08)")}
              >
                Open Incident →
              </button>
            </div>
          </div>
        </div>

        {/* ── Secondary grid: incidents + alert trend + system ──────── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 260px 260px" }}>

          {/* Recent incidents table */}
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <SectionHeader title="Recent Incidents" action="View all" onAction={() => onNavigate("incidents")} />
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--border)` }}>
                  {["ID", "Attack", "Device", "Severity", "Status", "Outcome"].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-[11px] font-semibold mono uppercase tracking-widest"
                      style={{ color: "var(--text-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.slice(0, 6).map((inc, i) => {
                  const sv = sevColor(inc.criticality);
                  const out = outcomeLabel(inc.outcome);
                  const st = statusPill(inc.status);
                  return (
                    <tr
                      key={inc.id}
                      className="cursor-pointer transition-colors"
                      style={{
                        borderBottom: i < 5 ? `1px solid var(--border)` : undefined,
                        borderLeft: `3px solid ${sv.bar}`,
                        background: hoveredInc === inc.id ? "var(--surface-2)" : "transparent",
                      }}
                      onClick={() => onNavigate("incident-overview")}
                      onMouseEnter={() => setHoveredInc(inc.id)}
                      onMouseLeave={() => setHoveredInc(null)}
                    >
                      <td className="px-4 py-2.5 mono text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                        {inc.id}
                      </td>
                      <td className="px-4 py-2.5 text-[13px]" style={{ color: "var(--text-2)" }}>
                        {inc.attack}
                      </td>
                      <td className="px-4 py-2.5 mono text-[12px]" style={{ color: "var(--text-3)" }}>
                        {inc.target}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="badge"
                          style={{ background: sv.bg, color: sv.text, borderColor: sv.border }}
                        >
                          {inc.criticality}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[11px] font-semibold mono px-1.5 py-0.5 rounded-[4px]"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[12px] font-medium" style={{ color: out.color }}>
                          {out.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 7-day alert trend */}
          <div className="card p-0 overflow-hidden">
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Alert Trend</div>
              <div className="text-[11px] mono mt-0.5" style={{ color: "var(--text-3)" }}>
                7-day · Demo data
              </div>
            </div>
            <div className="px-3 py-3">
              <div style={{ height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<TrendTooltip />} />
                    <Bar dataKey="critical" fill="#F53838" radius={[2,2,0,0]} stackId="a" />
                    <Bar dataKey="high"     fill="#E8650C" radius={[2,2,0,0]} stackId="a" />
                    <Bar dataKey="medium"   fill="#E8C20C" radius={[2,2,0,0]} stackId="a" />
                    <Bar dataKey="low"      fill="#0CB86B" radius={[2,2,0,0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {[
                  { label: "Critical", color: "#F53838" },
                  { label: "High",     color: "#E8650C" },
                  { label: "Medium",   color: "#E8C20C" },
                  { label: "Low",      color: "#0CB86B" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-3)" }}>
                    <span className="w-2 h-2 rounded-[2px]" style={{ background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System health */}
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <SectionHeader title="System Health" action="Details" onAction={() => onNavigate("system-health")} />
            </div>
            <div>
              {services.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < services.length - 1 ? `1px solid var(--border)` : undefined }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: s.status === "Online" ? "var(--success)" : "var(--danger)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>{s.name}</div>
                    <div className="mono text-[11px]" style={{ color: "var(--text-3)" }}>{s.detail}</div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-[12px] font-semibold" style={{ color: "var(--success)" }}>{s.latency}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 40/54: `src/screens/DeviceDetail.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import type { Screen } from "../types";
import { devices, incidents } from "../data/mock";

interface Props { onNavigate: (s: Screen) => void; }

export default function DeviceDetail({ onNavigate }: Props) {
  const d = devices[0]; // Hardcode mock for demo
  const [tab, setTab] = useState<"overview" | "incidents">("overview");

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate("devices")}
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors mb-3"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
          >
            ← Back to Inventory
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-[24px] font-bold" style={{ color: "var(--text)" }}>{d.name}</h1>
                <span className={`badge ${
                  d.criticality === "Critical" ? "sev-critical" : 
                  d.criticality === "High" ? "sev-high" : 
                  d.criticality === "Medium" ? "sev-medium" : "sev-low"
                }`}>
                  {d.criticality} Asset
                </span>
                <span className="badge" style={{ background: d.status === "Online" ? "rgba(28,201,112,0.1)" : "rgba(245,56,56,0.1)", color: d.status === "Online" ? "#1CC970" : "#F53838", borderColor: d.status === "Online" ? "rgba(28,201,112,0.3)" : "rgba(245,56,56,0.3)" }}>
                  {d.status}
                </span>
              </div>
              <div className="text-[13px] mono mt-2" style={{ color: "var(--text-3)" }}>
                IP: {d.ip} · MAC: {d.mac}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button className="btn btn-secondary btn-sm" disabled>Isolate Network</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-nav mb-6">
          {(["overview", "incidents"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-btn ${tab === t ? "active" : ""}`}
            >
              {t === "overview" ? "Asset Overview" : "Associated Incidents"}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && (
           <div className="grid grid-cols-[1fr_300px] gap-6">
              <div className="space-y-6">
                 {/* Details */}
                 <div className="card p-5">
                    <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Device Profile</h2>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                       <div>
                          <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Device Type</div>
                          <div className="text-[14px]" style={{ color: "var(--text)" }}>{d.type}</div>
                       </div>
                       <div>
                          <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Clinical Role</div>
                          <div className="text-[14px]" style={{ color: "var(--text)" }}>{d.clinicalRole}</div>
                       </div>
                       <div>
                          <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Hardware Manufacturer</div>
                          <div className="text-[14px]" style={{ color: "var(--text)" }}>{d.manufacturer}</div>
                       </div>
                       <div>
                          <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Model</div>
                          <div className="text-[14px]" style={{ color: "var(--text)" }}>{d.model}</div>
                       </div>
                    </div>
                 </div>

                 {/* Network Map / Topology placeholder */}
                 <div className="card p-5 h-[250px] flex flex-col">
                    <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Network Topology (Simulated)</h2>
                    <div className="flex-1 flex items-center justify-center border border-dashed rounded-[8px]" style={{ borderColor: "var(--border-2)", background: "var(--surface-2)" }}>
                       <div className="text-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" className="mx-auto mb-2">
                             <circle cx="12" cy="12" r="10" />
                             <line x1="2" y1="12" x2="22" y2="12" />
                             <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          <div className="text-[12px]" style={{ color: "var(--text-3)" }}>Connected to VLAN-40 (Medical IoT)</div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 {/* Risk Box */}
                 <div className="card p-5 flex flex-col justify-center items-center text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Calculated Risk Score</div>
                    <div className="text-[36px] font-bold mono leading-none mb-2" style={{ color: "#F0A020" }}>{d.riskScore}</div>
                    <div className="text-[12px]" style={{ color: "var(--text-3)" }}>Based on criticality, vulnerabilities, and recent incidents.</div>
                 </div>
                 
                 {/* Vulnerabilities */}
                 <div className="card p-5">
                    <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Open Vulnerabilities</h2>
                    <div className="space-y-3">
                       <div className="flex gap-2">
                          <span className="badge sev-high shrink-0 mt-0.5">CVE-2023-XXXX</span>
                          <div className="text-[12px] leading-tight" style={{ color: "var(--text-2)" }}>MQTT Broker authentication bypass in underlying OS library.</div>
                       </div>
                       <div className="flex gap-2">
                          <span className="badge sev-medium shrink-0 mt-0.5">CVE-2022-YYYY</span>
                          <div className="text-[12px] leading-tight" style={{ color: "var(--text-2)" }}>Weak default credentials on administration interface.</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
        
        {tab === "incidents" && (
           <div className="card overflow-hidden">
             <table className="data-table">
               <thead>
                 <tr>
                   <th>ID</th>
                   <th>Attack</th>
                   <th>Severity</th>
                   <th>Status</th>
                   <th>Date</th>
                 </tr>
               </thead>
               <tbody>
                  {incidents.filter(i => i.target.includes(d.name)).map(inc => (
                    <tr key={inc.id} onClick={() => onNavigate("incident-overview")} className="cursor-pointer">
                       <td className="font-semibold mono">{inc.id}</td>
                       <td>{inc.attack}</td>
                       <td>
                          <span className={`badge ${
                             inc.criticality === "Critical" ? "sev-critical" : 
                             inc.criticality === "High" ? "sev-high" : "sev-medium"
                           }`}>
                             {inc.criticality}
                          </span>
                       </td>
                       <td>{inc.status}</td>
                       <td className="mono">{inc.time}</td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        )}
        
      </div>
    </div>
  );
}
```


################################################################################
### FILE 41/54: `src/screens/Devices.tsx`
################################################################################

```tsx
import React, { useState, useMemo } from "react";
import { devices } from "../data/mock";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

// ── Icons ──
function DeviceIcon({ type }: { type: string }) {
  const isGateway = type.toLowerCase().includes("gateway");
  const isBroker = type.toLowerCase().includes("broker");
  
  return (
    <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "var(--surface-3)", border: "1px solid var(--border-2)" }}>
      {isGateway && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-2)" strokeWidth="1.2">
          <rect x="2" y="5" width="14" height="8" rx="2" />
          <path d="M6 13v2M12 13v2" strokeLinecap="round" />
        </svg>
      )}
      {isBroker && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-2)" strokeWidth="1.2">
          <circle cx="9" cy="9" r="4" />
          <path d="M9 1v4M9 13v4M1 9h4M13 9h4" strokeLinecap="round" />
        </svg>
      )}
      {!isGateway && !isBroker && (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-2)" strokeWidth="1.2">
          <path d="M4 9c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
          <circle cx="9" cy="9" r="2" />
        </svg>
      )}
    </div>
  );
}

// ── Baseline Meter ──
function BaselineMeter({ baseline }: { baseline: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
        <div className="h-full rounded-full" style={{ background: "var(--lime)", width: "60%" }} />
      </div>
      <span className="text-[11px] mono shrink-0" style={{ color: "var(--text-3)" }}>{baseline}</span>
    </div>
  );
}

export default function Devices({ onNavigate }: Props) {
  const [search, setSearch] = useState("");
  const [filterCrit, setFilterCrit] = useState("All");

  const filtered = useMemo(() => {
    let d = [...devices];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(x => x.name.toLowerCase().includes(q) || x.ip.includes(q) || x.type.toLowerCase().includes(q));
    }
    if (filterCrit !== "All") d = d.filter(x => x.criticality === filterCrit);
    return d;
  }, [search, filterCrit]);

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="px-6 py-5 max-w-[1440px] mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "var(--text)" }}>Device Inventory</h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Discovered clinical and infrastructure devices · Demonstration data
            </p>
          </div>
          <div className="flex items-center gap-2">
             <button className="btn btn-primary btn-sm">Export Inventory</button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Search devices by name, IP, or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field max-w-[300px]"
          />
          <div className="flex items-center gap-1">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map(c => (
              <button
                key={c}
                onClick={() => setFilterCrit(c)}
                className={`filter-chip ${filterCrit === c ? "active" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[14px]" style={{ color: "var(--text-3)" }}>
              No devices match your search criteria.
            </div>
          ) : (
            filtered.map((d) => (
              <div 
                key={d.id} 
                className="card p-5 cursor-pointer hover:border-[var(--border-2)] transition-colors group flex flex-col"
                onClick={() => onNavigate("device-detail")}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <DeviceIcon type={d.type} />
                    <div>
                      <div className="font-bold text-[15px] group-hover:text-[var(--lime)] transition-colors" style={{ color: "var(--text)" }}>{d.name}</div>
                      <div className="text-[12px] mono" style={{ color: "var(--text-3)" }}>{d.ip}</div>
                    </div>
                  </div>
                  <span className={`badge ${
                    d.criticality === "Critical" ? "sev-critical" : 
                    d.criticality === "High" ? "sev-high" : 
                    d.criticality === "Medium" ? "sev-medium" : "sev-low"
                  }`}>
                    {d.criticality}
                  </span>
                </div>

                <div className="space-y-3 mb-4 flex-1">
                  <div>
                    <div className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Clinical Role</div>
                    <div className="text-[13px] leading-tight" style={{ color: "var(--text-2)" }}>{d.clinicalRole}</div>
                  </div>
                  <div>
                     <div className="text-[11px] uppercase tracking-widest mb-0.5" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Hardware</div>
                     <div className="text-[13px]" style={{ color: "var(--text-2)" }}>{d.manufacturer} {d.model}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Telemetry Baseline</div>
                    <BaselineMeter baseline={d.baseline} />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.status === "Online" ? "var(--success)" : "var(--danger)" }} />
                    <span className="text-[12px] font-semibold" style={{ color: d.status === "Online" ? "var(--success)" : "var(--danger)" }}>{d.status}</span>
                  </div>
                  <span className="text-[11px] mono" style={{ color: "var(--text-3)" }}>Risk Score: {d.riskScore}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
```


################################################################################
### FILE 42/54: `src/screens/Evaluation.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }
type EvalTab = "detection" | "safereuse" | "response" | "system";

/* ── palette ──────────────────────────────────────────────── */
const P = {
  bg:      "#0A0C0A",
  surface: "#0D100D",
  border:  "#1A1E1B",
  text:    "#E2E8E2",
  text2:   "#94A8BA",
  green:   "#4ADE80",
  greenDim:"#14532D",
  red:     "#EF4444",
  amber:   "#D97706",
};

/* ── shared primitives ────────────────────────────────────── */
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0D100D] border border-[#1A1E1B] rounded-[10px] ${className}`}>
      {children}
    </div>
  );
}
function SLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] mono uppercase tracking-widest text-[#94A8BA] mb-3">{children}</div>;
}
function Num({ v, color, size = 36 }: { v: string; color?: string; size?: number }) {
  return (
    <span className="mono font-bold" style={{ fontSize: size, color: color ?? P.text, lineHeight: 1 }}>
      {v}
    </span>
  );
}

/* ── mathematically-accurate arc gauge ──────────────────────
   Uses trig that matches the printed value exactly.
   angleDeg(val) = 180 − (val/max)×180  (0→left, max→right, through top)
   SVG: x = cx + r·cos(θ), y = cy − r·sin(θ)  (y-flipped coord)
────────────────────────────────────────────────────────────── */
function svgPt(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}
function arcD(cx: number, cy: number, r: number, fromDeg: number, toDeg: number) {
  const s = svgPt(cx, cy, r, fromDeg);
  const e = svgPt(cx, cy, r, toDeg);
  const large = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
  // sweep-flag=0 → counter-clockwise in SVG (goes through the top)
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}
function valToDeg(val: number, min: number, max: number) {
  return 180 - ((val - min) / (max - min)) * 180;
}

/* ── circular arc gauge (full circle segment, for Response/System) ── */
function CircGauge({ value, max = 100, label, unit = "%", color = P.green, w = 120 }: {
  value: number; max?: number; label: string; unit?: string; color?: string; w?: number;
}) {
  const cx = w / 2, cy = w / 2, r = w / 2 - 14;
  // Sweep 240° starting at 150° (bottom-left) clockwise to 30° (bottom-right)
  // SVG clockwise: sweep-flag=1
  function circ(fromDeg: number, toDeg: number, _sweep: number) {
    const toR = (d: number) => (d * Math.PI) / 180;
    const s = { x: cx + r * Math.cos(toR(fromDeg)), y: cy + r * Math.sin(toR(fromDeg)) };
    const e = { x: cx + r * Math.cos(toR(toDeg)), y: cy + r * Math.sin(toR(toDeg)) };
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${_sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }
  const startDeg = 150, totalSweep = 240;
  const endDeg = startDeg + totalSweep;
  const fillPct = Math.min(value / max, 1);
  const fillEndDeg = startDeg + fillPct * totalSweep;
  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={w} viewBox={`0 0 ${w} ${w}`}>
        <path d={circ(startDeg, endDeg, 1)} stroke="#1E241E" strokeWidth="8" fill="none" strokeLinecap="round"/>
        {fillPct > 0 && <path d={circ(startDeg, fillEndDeg, 1)} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"/>}
        <text x={cx} y={cy + 5} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: w * 0.18, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fill: P.text }}>
          {value}{unit}
        </text>
      </svg>
      <div className="text-[12px] mono uppercase tracking-widest text-center" style={{ color: P.text2 }}>{label}</div>
    </div>
  );
}

/* ── semicircular gauge (0–20% scale, mathematically accurate) ──
   Angle: θ = 180 − (val/max)×180  (0% → 180° left, 20% → 0° right)
   SVG position: x = cx + r·cos(θ_rad), y = cy − r·sin(θ_rad)

   Sweep rules for the UPPER semicircle (going from high θ to low θ):
     Left half  (from 180° toward 90°): sweep-flag = 0  (CCW in SVG = upward)
     Right half (from 90°  toward 0° ): sweep-flag = 1  (CW  in SVG = rightward)
   Value fill (180° → needleDeg): sweep-flag = 0 always correct for any value.
────────────────────────────────────────────────────────────────── */
function SemiGauge({ value, maxVal = 20, label }: { value: number; maxVal?: number; label: string }) {
  const W = 260, H = 160;
  const cx = W / 2, cy = H - 24, r = 104;
  const sw = 14;

  function pt(deg: number, rr = r) {
    const rad = deg * Math.PI / 180;
    return { x: cx + rr * Math.cos(rad), y: cy - rr * Math.sin(rad) };
  }
  function arc(fromDeg: number, toDeg: number, sweep: 0 | 1) {
    const s = pt(fromDeg), e = pt(toDeg);
    const large = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }

  const needleDeg = 180 - (value / maxVal) * 180;
  const fillColor = value <= maxVal * 0.5 ? "#16A34A" : "#D97706";

  // Needle geometry
  const tip  = pt(needleDeg, r - 8);
  const base1 = pt(needleDeg + 90, 9);
  const base2 = pt(needleDeg - 90, 9);

  // Threshold tick at 10% (= 90°)
  const tIn  = pt(90, r - 18);
  const tOut = pt(90, r + 14);

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Track */}
        <path d={arc(180, 0, 0)} stroke="#1E241E" strokeWidth={sw} fill="none" strokeLinecap="round"/>
        {/* Green band 0–10% (180°→90°): sweep=0 */}
        <path d={arc(180, 90, 0)} stroke="#16A34A" strokeWidth={sw} fill="none" strokeLinecap="round" strokeOpacity="0.30"/>
        {/* Amber band 10–20% (90°→0°): sweep=1 — must use CW to stay in upper-right */}
        <path d={arc(90, 0, 1)} stroke="#D97706" strokeWidth={sw} fill="none" strokeLinecap="round" strokeOpacity="0.25"/>
        {/* Value fill (sweep=0 is correct for any needle position) */}
        <path d={arc(180, needleDeg, 0)} stroke={fillColor} strokeWidth={sw} fill="none" strokeLinecap="round"/>
        {/* 10% threshold tick */}
        <line x1={tIn.x.toFixed(2)} y1={tIn.y.toFixed(2)} x2={tOut.x.toFixed(2)} y2={tOut.y.toFixed(2)}
          stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
        <text x={tOut.x} y={tOut.y - 6} textAnchor="middle"
          style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#D97706" }}>10%</text>
        {/* Scale labels */}
        {[0, 5, 10, 15, 20].map(v => {
          const p = pt(180 - (v / maxVal) * 180, r + 22);
          return (
            <text key={v} x={p.x.toFixed(2)} y={p.y.toFixed(2)} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#94A8BA" }}>{v}%</text>
          );
        })}
        {/* Needle */}
        <polygon
          points={`${tip.x.toFixed(2)},${tip.y.toFixed(2)} ${base1.x.toFixed(2)},${base1.y.toFixed(2)} ${base2.x.toFixed(2)},${base2.y.toFixed(2)}`}
          fill={P.text} fillOpacity="0.92"/>
        <circle cx={cx} cy={cy} r="7" fill="#111511" stroke={P.text2} strokeWidth="1.5"/>
        {/* Centre value */}
        <text x={cx} y={cy - 24} textAnchor="middle"
          style={{ fontSize: 28, fontFamily: "JetBrains Mono", fontWeight: 700, fill: P.text }}>{value}%</text>
        <text x={cx} y={cy - 6} textAnchor="middle"
          style={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "#94A8BA" }}>of {maxVal}% scale</text>
      </svg>
      <div className="text-[12px] mono uppercase tracking-widest text-center" style={{ color: P.text2 }}>{label}</div>
      <div className="flex items-center gap-4 mt-1.5">
        <span className="flex items-center gap-1.5 text-[12px]">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#16A34A", opacity: 0.7 }}/>
          <span style={{ color: P.text2 }}>safe ≤ 10%</span>
        </span>
        <span className="flex items-center gap-1.5 text-[12px]">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#D97706", opacity: 0.7 }}/>
          <span style={{ color: P.text2 }}>caution ≤ 20%</span>
        </span>
      </div>
    </div>
  );
}

/* ── lollipop chart ──────────────────────────────────────── */
function ModelLollipop() {
  const models = [
    { name: "Random Forest", f1: 0.944, sel: false },
    { name: "XGBoost-v3",   f1: 0.957, sel: true  },
    { name: "LightGBM",     f1: 0.938, sel: false },
  ];
  const W = 280, H = 160, lp = 108, rp = 20, tp = 14, bp = 22;
  const pw = W - lp - rp, rH = (H - tp - bp) / models.length;
  const xMin = 0.92, xMax = 0.97;
  const xs = (v: number) => lp + ((v - xMin) / (xMax - xMin)) * pw;
  const grid = [0.93, 0.94, 0.95, 0.96];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {grid.map(v => (
        <g key={v}>
          <line x1={xs(v)} y1={tp} x2={xs(v)} y2={tp + (H - tp - bp)} stroke="#1A1E1B" strokeWidth="1" strokeDasharray="3 3"/>
          <text x={xs(v)} y={H - 6} textAnchor="middle"
            style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.text2 }}>{v.toFixed(2)}</text>
        </g>
      ))}
      {models.map((m, i) => {
        const y = tp + i * rH + rH / 2;
        const x = xs(m.f1);
        const col = m.sel ? P.green : P.text2;
        return (
          <g key={m.name}>
            <text x={lp - 8} y={y + 4} textAnchor="end"
              style={{ fontSize: 11, fontFamily: m.sel ? "JetBrains Mono" : "inherit", fontWeight: m.sel ? 700 : 400, fill: m.sel ? P.text : P.text2 }}>
              {m.name}
            </text>
            <line x1={xs(xMin)} y1={y} x2={x} y2={y} stroke={col} strokeWidth={m.sel ? 1.5 : 1} strokeOpacity={m.sel ? 1 : 0.5}/>
            <circle cx={x} cy={y} r={m.sel ? 6 : 4} fill={m.sel ? P.green : "none"} stroke={col} strokeWidth="1.5"/>
            <text x={x + 10} y={y + 4} style={{ fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: m.sel ? 700 : 400, fill: col }}>
              {m.f1.toFixed(3)}
            </text>
            {m.sel && <text x={x + 48} y={y + 4} style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.green }}>← selected</text>}
          </g>
        );
      })}
    </svg>
  );
}

/* ── dumbbell chart (compact, for Response tab) ──────────── */
function DumbbellChartSmall() {
  const rows = [
    { name: "SYN",          base: 76, prop: 91 },
    { name: "TCP",          base: 73, prop: 88 },
    { name: "UDP",          base: 70, prop: 87 },
    { name: "ICMP",         base: 78, prop: 92 },
    { name: "MQTT Connect", base: 80, prop: 93 },
    { name: "MQTT Publish", base: 77, prop: 91 },
  ];
  const W = 340, rH = 22, lp = 90, rp = 12, tp = 6, bp = 16;
  const H = rows.length * rH + tp + bp;
  const xMin = 60, xMax = 100;
  const xs = (v: number) => lp + ((v - xMin) / (xMax - xMin)) * (W - lp - rp);
  const grids = [70, 80, 90, 100];
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {grids.map(v => (
          <g key={v}>
            <line x1={xs(v)} y1={tp} x2={xs(v)} y2={tp + rows.length * rH} stroke="#1A1E1B" strokeWidth="1" strokeDasharray="3 3"/>
            <text x={xs(v)} y={H - 2} textAnchor="middle"
              style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.text2 }}>{v}%</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = tp + i * rH + rH / 2;
          const xb = xs(r.base), xp = xs(r.prop);
          return (
            <g key={r.name}>
              <text x={lp - 6} y={y + 3.5} textAnchor="end"
                style={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: P.text2 }}>{r.name}</text>
              <line x1={xb} y1={y} x2={xp} y2={y} stroke="#2A3A2A" strokeWidth="1.5"/>
              <circle cx={xb} cy={y} r="4" fill="#0D100D" stroke={P.text2} strokeWidth="1.5"/>
              <circle cx={xp} cy={y} r="4.5" fill={P.green}/>
              <text x={xb - 7} y={y + 3.5} textAnchor="end"
                style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }}>{r.base}%</text>
              <text x={xp + 7} y={y + 3.5} textAnchor="start"
                style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.green }}>{r.prop}%</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-1">
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: P.text2 }}>
          <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="#0D100D" stroke={P.text2} strokeWidth="1.5"/></svg>
          Baseline
        </span>
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: P.green }}>
          <svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill={P.green}/></svg>
          Proposed
        </span>
      </div>
    </div>
  );
}

/* ── dumbbell chart ──────────────────────────────────────── */
function DumbbellChart() {
  const rows = [
    { name: "SYN",          base: 76, prop: 91 },
    { name: "TCP",          base: 73, prop: 88 },
    { name: "UDP",          base: 70, prop: 87 },
    { name: "ICMP",         base: 78, prop: 92 },
    { name: "MQTT Connect", base: 80, prop: 93 },
    { name: "MQTT Publish", base: 77, prop: 91 },
  ];
  const W = 340, rH = 30, lp = 96, rp = 14, tp = 10, bp = 20;
  const H = rows.length * rH + tp + bp;
  const xMin = 60, xMax = 100;
  const xs = (v: number) => lp + ((v - xMin) / (xMax - xMin)) * (W - lp - rp);
  const grids = [70, 80, 90, 100];
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {grids.map(v => (
          <g key={v}>
            <line x1={xs(v)} y1={tp} x2={xs(v)} y2={tp + rows.length * rH} stroke="#1A1E1B" strokeWidth="1" strokeDasharray="3 3"/>
            <text x={xs(v)} y={H - 4} textAnchor="middle"
              style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.text2 }}>{v}%</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = tp + i * rH + rH / 2;
          const xb = xs(r.base), xp = xs(r.prop);
          return (
            <g key={r.name}>
              <text x={lp - 8} y={y + 4} textAnchor="end"
                style={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: P.text2 }}>{r.name}</text>
              <line x1={xb} y1={y} x2={xp} y2={y} stroke="#2A3A2A" strokeWidth="1.5"/>
              <circle cx={xb} cy={y} r="5" fill="#0D100D" stroke={P.text2} strokeWidth="1.5"/>
              <circle cx={xp} cy={y} r="5.5" fill={P.green}/>
              <text x={xb - 8} y={y + 4} textAnchor="end"
                style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }}>{r.base}%</text>
              <text x={xp + 8} y={y + 4} textAnchor="start"
                style={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.green }}>{r.prop}%</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 justify-center mt-1">
        <span className="flex items-center gap-1.5 text-[12px]" style={{ color: P.text2 }}>
          <svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill="#0D100D" stroke={P.text2} strokeWidth="1.5"/></svg>
          Baseline
        </span>
        <span className="flex items-center gap-1.5 text-[12px]" style={{ color: P.green }}>
          <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill={P.green}/></svg>
          Proposed
        </span>
      </div>
    </div>
  );
}

/* ── pipeline flow ────────────────────────────────────────── */
function PipelineFlow() {
  const stages = [
    { id: "baseline",    label: "Baseline",    skip: false },
    { id: "attack",      label: "Attack",      skip: false },
    { id: "detect",      label: "Detect",      skip: false },
    { id: "cbr",         label: "CBR Match",   skip: false, hi: true },
    { id: "route",       label: "Route",       skip: true  },
    { id: "investigate", label: "Investigate", skip: true  },
    { id: "respond",     label: "Respond",     skip: false },
  ];
  return (
    <div>
      <div className="flex items-center gap-0 flex-wrap">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div style={{ opacity: s.skip ? 0.35 : 1 }} className="flex flex-col items-center">
              <div className="px-2 py-1.5 rounded-[5px] text-[11px] mono font-medium"
                style={{
                  border: s.skip ? "1px dashed #2A342A" : s.hi ? `1px solid ${P.green}` : "1px solid #1A1E1B",
                  background: s.hi ? "#0A1A0A" : "#0D100D",
                  color: s.skip ? "#4A5A4A" : s.hi ? P.green : P.text2,
                }}>
                {s.label}
              </div>
              {s.skip && <div className="text-[9px] mono mt-0.5" style={{ color: "#4A5A4A" }}>skipped</div>}
            </div>
            {i < stages.length - 1 && (
              <div className="w-3 h-px mx-0.5 shrink-0"
                style={{ background: "#2A342A", borderTop: stages[i + 1]?.skip ? "1px dashed #2A342A" : undefined }}/>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[24px] font-bold mono" style={{ color: P.green }}>~65%</span>
        <span className="text-[13px]" style={{ color: P.text2 }}>fewer investigation steps vs. full investigation</span>
      </div>
    </div>
  );
}

/* ── similarity histogram ─────────────────────────────────── */
function SimilarityHist() {
  const bins = [
    { range: "0.50–0.55", count: 2 },
    { range: "0.55–0.60", count: 4 },
    { range: "0.60–0.65", count: 8 },
    { range: "0.65–0.70", count: 14 },
    { range: "0.70–0.75", count: 18 },
    { range: "0.75–0.80", count: 22 },  // threshold at 0.75
    { range: "0.80–0.85", count: 28 },
    { range: "0.85–0.90", count: 20 },
    { range: "0.90–0.95", count: 12 },
    { range: "0.95–1.00", count: 6 },
  ];
  const W = 260, H = 120, lp = 28, rp = 10, tp = 8, bp = 28;
  const pw = W - lp - rp, ph = H - tp - bp;
  const bw = pw / bins.length;
  const maxC = Math.max(...bins.map(b => b.count));
  const threshIdx = 5; // "0.75–0.80" is index 5, threshold is at left edge = between idx 4 and 5
  const threshX = lp + threshIdx * bw;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {bins.map((b, i) => {
        const bh = (b.count / maxC) * ph;
        const x = lp + i * bw;
        const y = tp + ph - bh;
        const aboveThresh = i >= threshIdx;
        return (
          <g key={b.range}>
            <rect x={x + 1} y={y} width={bw - 2} height={bh}
              fill={aboveThresh ? P.green : "#2A3A2A"} fillOpacity={aboveThresh ? 0.7 : 0.4} rx="1"/>
          </g>
        );
      })}
      {/* Threshold line */}
      <line x1={threshX} y1={tp} x2={threshX} y2={tp + ph + 4} stroke={P.amber} strokeWidth="1.5" strokeDasharray="4 3"/>
      <text x={threshX + 3} y={tp + 10} style={{ fontSize: 9, fontFamily: "JetBrains Mono", fill: P.amber }}>threshold 0.75</text>
      {/* X axis labels */}
      {[0, 4, 9].map(i => (
        <text key={i} x={lp + i * bw + bw / 2} y={H - 4} textAnchor="middle"
          style={{ fontSize: 8, fontFamily: "JetBrains Mono", fill: P.text2 }}>
          {(0.50 + i * 0.05).toFixed(2)}
        </text>
      ))}
      <text x={lp + 10 * bw / 2} y={H - 4} textAnchor="middle"
        style={{ fontSize: 8, fontFamily: "JetBrains Mono", fill: P.text2 }}>1.00</text>
      {/* Y axis */}
      <text x={lp - 4} y={tp + 4} textAnchor="end" style={{ fontSize: 8, fontFamily: "JetBrains Mono", fill: P.text2 }}>{maxC}</text>
      <text x={lp - 4} y={tp + ph} textAnchor="end" style={{ fontSize: 8, fontFamily: "JetBrains Mono", fill: P.text2 }}>0</text>
      <line x1={lp} y1={tp} x2={lp} y2={tp + ph} stroke="#1A1E1B" strokeWidth="1"/>
    </svg>
  );
}

/* ── system radar ─────────────────────────────────────────── */
const RADAR_CONFIGS: Record<string, number[]> = {
  "Full Investigation":  [0.60, 0.70, 0.65, 0.68, 0.72],
  "Similarity Only":     [0.76, 0.80, 0.75, 0.76, 0.82],
  "Proposed Safe Reuse": [0.91, 0.92, 0.88, 0.85, 0.94],
};
const RADAR_AXES = ["Latency", "Throughput", "CPU eff.", "RAM eff.", "Queue lag"];
const CONFIG_COLORS: Record<string, string> = {
  "Full Investigation":  "#4A5A6A",
  "Similarity Only":     "#6A7A8A",
  "Proposed Safe Reuse": P.green,
};
function SystemRadar({ active }: { active: string }) {
  const data = RADAR_AXES.map((ax, i) => {
    const entry: Record<string, any> = { axis: ax };
    Object.entries(RADAR_CONFIGS).forEach(([k, v]) => { entry[k] = v[i]; });
    return entry;
  });
  return (
    <ResponsiveContainer width="100%" height={190}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="#1A1E1B"/>
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: P.text2 }}/>
        {Object.keys(RADAR_CONFIGS).map(k => (
          <Radar key={k} name={k} dataKey={k}
            stroke={CONFIG_COLORS[k]} fill={CONFIG_COLORS[k]}
            fillOpacity={k === active ? 0.16 : 0.03}
            strokeWidth={k === active ? 1.8 : 0.8}
            strokeOpacity={k === active ? 1 : 0.4}
            dot={false}/>
        ))}
        <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
          formatter={((v: any, name: any) => [typeof v === "number" ? v.toFixed(2) : v, name]) as any}/>
      </RadarChart>
    </ResponsiveContainer>
  );
}

const EXPERIMENTS = ["Full Investigation", "Similarity Only", "Proposed Safe Reuse"] as const;
type Exp = typeof EXPERIMENTS[number];

/* ════════════════════════════════════════════════════════════
   DETECTION TAB
════════════════════════════════════════════════════════════ */
const DETECTION_RADAR = [
  { axis: "Precision",   v: 0.963 },
  { axis: "Recall",      v: 0.951 },
  { axis: "F1",          v: 0.957 },
  { axis: "1-FPR",       v: 0.979 },
  { axis: "Specificity", v: 0.979 },
];

function DetectionTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 — stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Precision",           value: "0.963", warn: false, note: "XGBoost-v3" },
          { label: "Recall",              value: "0.951", warn: false, note: "XGBoost-v3" },
          { label: "Macro F1",            value: "0.957", warn: false, note: "macro-average" },
          { label: "False Positive Rate", value: "2.1%",  warn: true,  note: "lower is better" },
        ].map(m => (
          <Panel key={m.label} className="px-5 py-4 text-center">
            <div className="text-[40px] font-bold mono leading-none mb-2"
              style={{ color: m.warn ? P.red : P.text }}>{m.value}</div>
            <div className="text-[12px] mono uppercase tracking-widest mb-1" style={{ color: P.text2 }}>{m.label}</div>
            {m.warn
              ? <div className="text-[11px]" style={{ color: P.amber }}>alert · lower is better</div>
              : <div className="text-[11px]" style={{ color: P.text2 }}>{m.note}</div>}
          </Panel>
        ))}
      </div>

      {/* Row 2 — 3 panels */}
      <div className="grid grid-cols-3 gap-3">
        {/* Radar */}
        <Panel className="p-4">
          <SLabel>Metric profile · XGBoost-v3</SLabel>
          <div style={{ height: 185 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={DETECTION_RADAR} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                <PolarGrid stroke="#1A1E1B"/>
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: P.text2 }}/>
                <Radar dataKey="v" stroke={P.green} fill={P.green} fillOpacity={0.12} strokeWidth={1.5} dot={false}/>
                <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  formatter={((v: any) => [typeof v === "number" ? v.toFixed(3) : v, "Score"]) as any}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Confusion matrix */}
        <Panel className="p-4">
          <SLabel>Confusion matrix · XGBoost-v3 · in-domain</SLabel>
          <div className="grid grid-cols-[72px_1fr_1fr] gap-1">
            <div/>
            <div className="text-[10px] mono text-center pb-1" style={{ color: P.text2 }}>Pred: Attack</div>
            <div className="text-[10px] mono text-center pb-1" style={{ color: P.text2 }}>Pred: Benign</div>
            {[
              { row: "Actual: Attack", cells: [
                { v: 284, sub: "True Positive",  bg: "#0B1B0B", bc: "#1A341A", col: P.green },
                { v: 14,  sub: "False Negative", bg: "#1B0B0B", bc: "#341A1A", col: P.red },
              ]},
              { row: "Actual: Benign", cells: [
                { v: 11,  sub: "False Positive", bg: "#1B0B0B", bc: "#341A1A", col: P.red },
                { v: 512, sub: "True Negative",  bg: "#0B1B0B", bc: "#1A341A", col: P.green },
              ]},
            ].map(row => (
              <React.Fragment key={row.row}>
                <div className="flex items-center">
                  <span className="text-[10px] mono leading-tight" style={{ color: P.text2 }}>{row.row}</span>
                </div>
                {row.cells.map((c, ci) => (
                  <div key={ci} className="px-2 py-2.5 rounded-[6px] text-center"
                    style={{ background: c.bg, border: `1px solid ${c.bc}` }}>
                    <div className="text-[28px] font-bold mono leading-none" style={{ color: c.col }}>{c.v}</div>
                    <div className="text-[10px] mono mt-0.5" style={{ color: c.col, opacity: 0.7 }}>{c.sub}</div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </Panel>

        {/* Lollipop */}
        <Panel className="p-4">
          <SLabel>Model comparison · F1 score</SLabel>
          <ModelLollipop/>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {[
              { m: "RF",   p: 0.951, r: 0.939 },
              { m: "XGB",  p: 0.963, r: 0.951 },
              { m: "LGBM", p: 0.944, r: 0.932 },
            ].map(row => (
              <div key={row.m} className="px-2 py-1.5 rounded-[5px] text-center bg-[#0A0C0A] border border-[#1A1E1B]">
                <div className="text-[10px] mono mb-0.5" style={{ color: P.text2 }}>{row.m}</div>
                <div className="text-[11px] mono" style={{ color: P.text }}>P {row.p}</div>
                <div className="text-[11px] mono" style={{ color: P.text }}>R {row.r}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Row 3 — 2 panels */}
      <div className="grid grid-cols-2 gap-3">
        {/* F1 per attack type */}
        <Panel className="p-4">
          <SLabel>F1 score by attack type</SLabel>
          {[
            { name: "SYN",          f1: 0.96 },
            { name: "TCP",          f1: 0.95 },
            { name: "UDP",          f1: 0.97 },
            { name: "ICMP",         f1: 0.94 },
            { name: "MQTT Connect", f1: 0.96 },
            { name: "MQTT Publish", f1: 0.95 },
          ].map(r => {
            const pct = ((r.f1 - 0.90) / 0.10) * 100;
            return (
              <div key={r.name} className="flex items-center gap-3 mb-2">
                <div className="w-[100px] text-[13px] mono shrink-0" style={{ color: P.text2 }}>{r.name}</div>
                <div className="flex-1 relative h-[18px] bg-[#0A0C0A] rounded-[3px] overflow-hidden">
                  <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: "#16A34A" }}/>
                </div>
                <div className="w-[38px] text-[13px] mono text-right font-semibold shrink-0" style={{ color: P.green }}>
                  {r.f1.toFixed(2)}
                </div>
              </div>
            );
          })}
        </Panel>

        {/* Cross-dataset generalization */}
        <Panel className="p-4">
          <SLabel>Cross-dataset generalization</SLabel>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-[7px] border border-[#1A1E1B] bg-[#0A0C0A]">
              <div className="text-[11px] mono uppercase tracking-widest mb-2" style={{ color: P.text2 }}>In-domain F1</div>
              <div className="text-[32px] font-bold mono" style={{ color: P.text }}>0.957</div>
              <div className="text-[11px] mt-1" style={{ color: P.text2 }}>MQTT testbed dataset</div>
            </div>
            <div className="p-3 rounded-[7px] bg-[#0A0C0A]" style={{ border: "1px dashed #3E4C3E" }}>
              <div className="text-[11px] mono uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>External F1</div>
              <div className="text-[32px] font-bold mono" style={{ color: "#94A3B8" }}>—</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"/>
                <span className="text-[11px]" style={{ color: "#94A3B8" }}>pending · not collected</span>
              </div>
            </div>
            <div className="p-3 rounded-[7px] bg-[#0A0C0A]" style={{ border: "1px dashed #3E4C3E" }}>
              <div className="text-[11px] mono uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>Generaliz. Δ</div>
              <div className="text-[32px] font-bold mono" style={{ color: "#94A3B8" }}>—</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]"/>
                <span className="text-[11px]" style={{ color: "#94A3B8" }}>pending · external − in-domain</span>
              </div>
            </div>
          </div>
          <div className="mt-3 px-3 py-2 rounded-[6px]" style={{ background: "#0A0C0A", border: "1px dashed #3E4C3E" }}>
            <div className="text-[12px] mono" style={{ color: "#94A3B8" }}>
              Dashed border = pending metric · data collection planned post-submission.
              In-domain result is confirmed; cross-domain generalisation is a known open question.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ── bullet-graph KPI bar ─────────────────────────────────── */
interface BulletBand  { from: number; to: number; color: string; opacity: number; }
interface BulletThresh { at: number; label: string; color: string; }
function BulletBar({ value, maxVal, bands, thresholds, ticks }: {
  value: number; maxVal: number;
  bands: BulletBand[]; thresholds: BulletThresh[]; ticks: number[];
}) {
  const barH = 28, trackH = 14;
  const pct = (v: number) => `${(v / maxVal) * 100}%`;

  return (
    <div>
      {/* Big value readout */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-[44px] font-bold mono leading-none" style={{ color: P.green }}>{value}%</span>
        <span className="text-[14px] mono" style={{ color: P.text2 }}>of {maxVal}% scale · proposed system</span>
      </div>

      {/* Bar track */}
      <div className="relative" style={{ height: barH }}>
        {/* Background bands */}
        {bands.map((b, i) => (
          <div key={i} className="absolute inset-y-0 rounded-[3px]"
            style={{
              left: pct(b.from), width: pct(b.to - b.from),
              background: b.color, opacity: b.opacity,
            }}/>
        ))}
        {/* Filled value bar — centered vertically, slimmer than track */}
        <div className="absolute rounded-[3px]"
          style={{
            left: 0, width: pct(value),
            top: (barH - trackH) / 2, height: trackH,
            background: value <= (thresholds[0]?.at ?? maxVal / 2) ? "#16A34A" : "#D97706",
          }}/>
        {/* Threshold ticks */}
        {thresholds.map(t => (
          <div key={t.at} className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: pct(t.at), transform: "translateX(-50%)" }}>
            <div className="w-[2px] h-full rounded-full" style={{ background: t.color }}/>
          </div>
        ))}
      </div>

      {/* Axis labels */}
      <div className="relative mt-1" style={{ height: 18 }}>
        {ticks.map(v => (
          <span key={v} className="absolute text-[11px] mono" style={{
            left: pct(v), transform: "translateX(-50%)", color: v === thresholds[0]?.at ? "#D97706" : P.text2,
            fontWeight: v === thresholds[0]?.at ? 600 : 400,
          }}>{v}%</span>
        ))}
      </div>

      {/* Threshold label below */}
      {thresholds.map(t => (
        <div key={t.at} className="flex items-center gap-1.5 mt-3">
          <div className="w-[2px] h-3.5 rounded-full" style={{ background: t.color }}/>
          <span className="text-[12px] mono" style={{ color: t.color }}>
            {t.label} threshold · safe zone ends here
          </span>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2">
        {bands.map((b, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[12px]">
            <span className="w-3 h-3 rounded-[2px] inline-block" style={{ background: b.color, opacity: b.opacity * 2 }}/>
            <span style={{ color: P.text2 }}>
              {b.from}–{b.to}% {b.color === "#16A34A" ? "· safe" : "· caution"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SAFE REUSE TAB
════════════════════════════════════════════════════════════ */
const SR_TABLE = [
  { metric: "Safe-Reuse Precision",  fullInv: "—",     simOnly: "0.71", proposed: "0.94" },
  { metric: "Wrong-Reuse Rate",      fullInv: "—",     simOnly: "22%",  proposed: "6%"   },
  { metric: "Median TTC (s)",        fullInv: "~60 s", simOnly: "~18 s",proposed: "~14 s"},
  { metric: "Harmful Response Rate", fullInv: "2%",    simOnly: "9%",   proposed: "2%"   },
];

function SafeReuseTab() {
  const histData = [
    { s: 0.50, n: 22 }, { s: 0.55, n: 18 }, { s: 0.60, n: 14 }, { s: 0.65, n: 20 },
    { s: 0.70, n: 16 }, { s: 0.75, n: 28 }, { s: 0.80, n: 34 }, { s: 0.85, n: 26 },
    { s: 0.90, n: 20 }, { s: 0.95, n: 12 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 */}
      <div className="grid grid-cols-3 gap-3">
        {/* Bullet-graph KPI bar */}
        <Panel className="p-5">
          <SLabel>Wrong-reuse rate · 0–20% scale</SLabel>
          <BulletBar value={6} maxVal={20} thresholds={[{ at: 10, label: "10%", color: "#D97706" }]}
            bands={[
              { from: 0,  to: 10, color: "#16A34A", opacity: 0.18 },
              { from: 10, to: 20, color: "#D97706", opacity: 0.13 },
            ]}
            ticks={[0, 5, 10, 15, 20]}
          />
        </Panel>

        {/* Pipeline flow */}
        <Panel className="p-4">
          <SLabel>Investigation pipeline · CBR reuse path</SLabel>
          <PipelineFlow/>
          <div className="mt-3 text-[12px]" style={{ color: P.text2 }}>
            Highlighted stages execute; grayed/dashed stages are skipped when a high-confidence CBR match is found.
          </div>
        </Panel>

        {/* Baseline comparison table */}
        <Panel className="p-4">
          <SLabel>Baseline comparison</SLabel>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1E1B]">
                <th className="text-left pb-2 text-[10px] mono uppercase tracking-widest font-medium" style={{ color: P.text2 }}>Metric</th>
                <th className="text-center pb-2 text-[10px] mono uppercase tracking-widest font-medium" style={{ color: P.text2 }}>Full Inv.</th>
                <th className="text-center pb-2 text-[10px] mono uppercase tracking-widest font-medium" style={{ color: P.text2 }}>Sim Only</th>
                <th className="text-center pb-2 text-[10px] mono uppercase tracking-widest font-medium" style={{ color: P.green }}>Proposed ✓</th>
              </tr>
            </thead>
            <tbody>
              {SR_TABLE.map(row => (
                <tr key={row.metric} className="border-b border-[#131613] last:border-0">
                  <td className="py-2 text-[13px]" style={{ color: P.text2 }}>{row.metric}</td>
                  <td className="py-2 text-center mono text-[13px]" style={{ color: P.text2 }}>{row.fullInv}</td>
                  <td className="py-2 text-center mono text-[13px]" style={{ color: P.text2 }}>{row.simOnly}</td>
                  <td className="py-2 text-center mono text-[14px] font-bold rounded-sm" style={{ color: P.green, background: "#0A1A0A" }}>
                    {row.proposed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Similarity histogram */}
        <Panel className="p-4">
          <SLabel>Retrieval similarity score distribution · n=134 cases</SLabel>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={histData.map(d => ({ x: d.s.toFixed(2), n: d.n }))}
                margin={{ top: 8, right: 12, bottom: 12, left: 8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1A1E1B" vertical={false}/>
                <XAxis dataKey="x" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }} tickLine={false} axisLine={false}/>
                <ReferenceLine x="0.75" stroke={P.amber} strokeWidth={1.5} strokeDasharray="5 3"
                  label={{ value: "threshold 0.75", position: "insideTopRight", fontSize: 10, fontFamily: "JetBrains Mono", fill: P.amber }}/>
                <Line type="monotone" dataKey="n" stroke={P.green} strokeWidth={1.5} dot={{ r: 2.5, fill: P.green }} name="Cases"/>
                <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  formatter={((v: any) => [v, "cases"]) as any}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 justify-center mt-1 text-[11px]">
            <span style={{ color: P.text2 }}>Left of threshold → full investigation</span>
            <span style={{ color: P.green }}>Right → reused directly</span>
          </div>
        </Panel>

        {/* Reuse coverage */}
        <Panel className="p-4">
          <SLabel>Reuse coverage breakdown</SLabel>
          <div className="flex items-center gap-6">
            <div style={{ height: 160, width: 160, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ v: 73 }, { v: 27 }]} dataKey="v" cx="50%" cy="50%"
                    innerRadius={46} outerRadius={68} startAngle={90} endAngle={-270}
                    strokeWidth={0}>
                    <Cell fill="#16A34A" fillOpacity={0.85}/>
                    <Cell fill="#1A1E1B"/>
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-[36px] font-bold mono leading-none" style={{ color: P.green }}>73%</div>
                <div className="text-[13px] mt-0.5" style={{ color: P.text2 }}>matched a stored case</div>
                <div className="text-[11px] mono" style={{ color: P.text2 }}>above 0.75 threshold · reused directly</div>
              </div>
              <div className="w-full h-px bg-[#1A1E1B]"/>
              <div>
                <div className="text-[28px] font-bold mono leading-none" style={{ color: P.text2 }}>27%</div>
                <div className="text-[13px] mt-0.5" style={{ color: P.text2 }}>routed to full investigation</div>
                <div className="text-[11px] mono" style={{ color: P.text2 }}>no confident match found</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   RESPONSE TAB
════════════════════════════════════════════════════════════ */
const TTC_TREND = [
  { inc: "INC-97", t: 38 }, { inc: "INC-98", t: 35 }, { inc: "INC-99", t: 30 },
  { inc: "INC-100", t: 27 }, { inc: "INC-101", t: 24 }, { inc: "INC-102", t: 20 },
  { inc: "INC-103", t: 17 }, { inc: "INC-104", t: 14 },
];

const DONUT_ROUTES = [
  { name: "Short",   value: 60, color: "#16A34A" },
  { name: "Partial", value: 30, color: "#D97706" },
  { name: "Deep",    value: 10, color: "#5A5A8A" },
];

function ResponseTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 — gauges get half, dumbbell gets other half */}
      <div className="grid grid-cols-2 gap-3">
        {/* 2 gauges — larger, properly anchored */}
        <Panel className="p-5">
          <SLabel>Response outcomes</SLabel>
          <div className="flex items-center justify-center gap-10 mt-2">
            <CircGauge value={90} label="Attack Suppression" color={P.green} w={140}/>
            <CircGauge value={88} label="Service Availability" color={P.green} w={140}/>
          </div>
        </Panel>

        {/* Dumbbell chart — condensed row height */}
        <Panel className="p-4">
          <SLabel>Suppression % by attack vector · baseline vs. proposed</SLabel>
          <DumbbellChartSmall/>
        </Panel>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Donut — route distribution */}
        <Panel className="p-4">
          <SLabel>Response route distribution</SLabel>
          <div className="flex items-center gap-6">
            <div style={{ height: 160, width: 160, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={DONUT_ROUTES} dataKey="value" cx="50%" cy="50%"
                    innerRadius={44} outerRadius={66} startAngle={90} endAngle={-270} strokeWidth={2} stroke="#0D100D">
                    {DONUT_ROUTES.map((r, i) => <Cell key={i} fill={r.color} fillOpacity={0.8}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                    formatter={((v: any, name: any) => [typeof v === "number" ? `${v}%` : v, name]) as any}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {DONUT_ROUTES.map(r => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: r.color }}/>
                    <span className="text-[14px]" style={{ color: P.text2 }}>{r.name}</span>
                  </div>
                  <span className="text-[20px] font-bold mono" style={{ color: P.text }}>{r.value}%</span>
                </div>
              ))}
              <div className="text-[11px] mono mt-2" style={{ color: P.text2 }}>
                60% of cases resolved in &lt;20 s via short route
              </div>
            </div>
          </div>
        </Panel>

        {/* TTC trend */}
        <Panel className="p-4">
          <SLabel>Median time-to-contain · last 8 incidents (s)</SLabel>
          <div style={{ height: 165 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TTC_TREND} margin={{ top: 8, right: 16, bottom: 12, left: -8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1A1E1B" vertical={false}/>
                <XAxis dataKey="inc" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }} tickLine={false} axisLine={false}/>
                <YAxis domain={[0, 45]} tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: P.text2 }} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ background: "#111511", border: "1px solid #242924", borderRadius: 6, color: "#E8EDE9", fontSize: 12, fontFamily: "JetBrains Mono" }}
                  formatter={((v: any) => [typeof v === "number" ? `${v} s` : v, "Median TTC"]) as any}/>
                <Line type="monotone" dataKey="t" stroke={P.green} strokeWidth={1.8}
                  dot={{ r: 3, fill: P.green, strokeWidth: 0 }} name="TTC (s)"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[12px] mono text-center mt-1" style={{ color: P.text2 }}>
            38 s → 14 s as case memory grows · CBR reuse effect
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SYSTEM TAB
════════════════════════════════════════════════════════════ */
function SystemTab() {
  const [active, setActive] = useState<Exp>("Proposed Safe Reuse");
  const agents = [
    { name: "Controller",   ms: 4,  slow: false },
    { name: "Memory/CBR",   ms: 8,  slow: false },
    { name: "Investigator", ms: 13, slow: true  },
    { name: "Explanation",  ms: 3,  slow: false },
    { name: "Response",     ms: 2,  slow: false },
  ];
  const maxMs = Math.max(...agents.map(a => a.ms));

  return (
    <div className="flex flex-col gap-4">
      {/* Experiment selector */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] mono mr-1" style={{ color: P.text2 }}>Experiment:</span>
        {EXPERIMENTS.map(e => (
          <button key={e} onClick={() => setActive(e)}
            className="px-3 py-1.5 rounded-[6px] text-[14px] mono font-medium transition-colors border"
            style={{
              background: active === e ? "#0A1A0A" : "transparent",
              color: active === e ? P.green : P.text2,
              borderColor: active === e ? P.green + "55" : "#1A1E1B",
            }}>
            {e}
          </button>
        ))}
      </div>

      {/* Row 1 — 4 panels */}
      <div className="grid grid-cols-4 gap-3">
        {/* CPU gauge */}
        <Panel className="p-4 flex flex-col items-center justify-center">
          <SLabel>CPU utilisation</SLabel>
          <CircGauge value={34} label="CPU Usage" color="#94A8BA" w={110}/>
        </Panel>

        {/* RAM gauge */}
        <Panel className="p-4 flex flex-col items-center justify-center">
          <SLabel>RAM utilisation</SLabel>
          <CircGauge value={62} label="RAM (% of 2 GB)" color="#94A8BA" w={110}/>
          <div className="text-[12px] mono mt-1 text-center" style={{ color: P.text2 }}>1.2 GB used</div>
        </Panel>

        {/* Radar overlay */}
        <Panel className="p-4">
          <SLabel>Config overlay · all experiments</SLabel>
          <SystemRadar active={active}/>
          <div className="flex items-center justify-center gap-3 mt-0.5">
            {Object.entries(CONFIG_COLORS).map(([k, col]) => (
              <span key={k} className="flex items-center gap-1 text-[10px]" style={{ color: col }}>
                <span className="inline-block w-3 h-[1.5px]" style={{ background: col }}/>
                {k === "Full Investigation" ? "Full" : k === "Similarity Only" ? "Sim" : "Proposed"}
              </span>
            ))}
          </div>
        </Panel>

        {/* Stat list */}
        <Panel className="p-4">
          <SLabel>Performance stats · {active === "Proposed Safe Reuse" ? "proposed" : active.toLowerCase()}</SLabel>
          {[
            { label: "Median E2E latency", value: "28 ms" },
            { label: "P95 E2E latency",    value: "52 ms" },
            { label: "Throughput",         value: "340 ev/s" },
            { label: "Queue lag",          value: "< 5 ms" },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-[#131613] last:border-0">
              <span className="text-[13px]" style={{ color: P.text2 }}>{s.label}</span>
              <span className="text-[15px] mono font-semibold" style={{ color: P.text }}>{s.value}</span>
            </div>
          ))}
        </Panel>
      </div>

      {/* Row 2 — per-agent latency */}
      <Panel className="p-4">
        <SLabel>Per-agent pipeline latency (ms) · median · Investigator is the dominant stage</SLabel>
        <div className="flex flex-col gap-2 mt-1">
          {agents.map(a => {
            const pct = (a.ms / maxMs) * 100;
            return (
              <div key={a.name} className="flex items-center gap-3">
                <div className="w-[110px] text-[14px] mono shrink-0" style={{ color: a.slow ? P.red : P.text2 }}>
                  {a.name}
                  {a.slow && <span className="ml-2 text-[10px]" style={{ color: P.red }}>slowest</span>}
                </div>
                <div className="flex-1 h-[20px] bg-[#0A0C0A] rounded-[3px] overflow-hidden relative">
                  <div className="h-full rounded-[3px] transition-all"
                    style={{ width: `${pct}%`, background: a.slow ? P.red + "AA" : "#16A34A88" }}/>
                </div>
                <div className="w-[44px] text-[14px] mono font-semibold text-right shrink-0"
                  style={{ color: a.slow ? P.red : P.green }}>
                  {a.ms} ms
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[12px] mono" style={{ color: P.text2 }}>
          Total pipeline p50: ~30 ms · Controller + Memory + Response account for &lt;50% combined
        </div>
      </Panel>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ROOT
════════════════════════════════════════════════════════════ */
const TABS: { id: EvalTab; label: string }[] = [
  { id: "detection", label: "Detection" },
  { id: "safereuse", label: "Safe Reuse" },
  { id: "response",  label: "Response" },
  { id: "system",    label: "System" },
];

export default function Evaluation({ onNavigate }: Props) {
  const [tab, setTab] = useState<EvalTab>("detection");
  return (
    <div className="h-full overflow-y-auto bg-[#0A0C0A]">
      <div className="max-w-[1440px] mx-auto px-8 py-5 fade-in">

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-[#1A1E1B] mb-5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-2.5 text-[16px] font-medium mono transition-all border-b-2 -mb-px"
              style={{
                borderColor: tab === t.id ? P.green : "transparent",
                color: tab === t.id ? P.text : P.text2,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "detection" && <DetectionTab/>}
        {tab === "safereuse" && <SafeReuseTab/>}
        {tab === "response"  && <ResponseTab/>}
        {tab === "system"    && <SystemTab/>}
      </div>
    </div>
  );
}
```


################################################################################
### FILE 43/54: `src/screens/ForgotPassword.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setError(null);
    setLoading(true);

    // Mock network request
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    
    // In a mock environment, any email gives a success message to prevent user enumeration
    setSuccess(true);
  }

  return (
    <div className="min-h-screen bg-[#0C0F0D] flex items-center justify-center relative overflow-hidden">
      {/* Background decorations matching Login */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#B6FF3B" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#B6FF3B] opacity-[0.03] blur-[120px] pointer-events-none"/>

      <div className="relative w-full max-w-[400px] px-6 fade-in">
        <div className="mb-8 text-center">
          <h1 className="font-bold text-[32px] text-[#E8EDE9] leading-snug tracking-tight">Recover Password</h1>
          <p className="text-[15px] text-[#94A8BA] mt-2">Enter your email to receive reset instructions.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111511] border border-[#242924] rounded-[16px] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
          noValidate
        >
          {error && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-5 rounded-[8px] text-[14px]"
              style={{ background: "#1C0808", border: "1px solid #3A1010", color: "#F87171" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-[#14291A] border border-[#1A3D22] rounded-full mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </div>
               <div className="text-[17px] font-semibold text-[#E8EDE9] mb-2">Check your email</div>
               <div className="text-[14px] text-[#94A8BA] mb-6">
                 If an account exists for <strong className="text-[#E8EDE9]">{email}</strong>, we have sent password reset instructions.
               </div>
               
               {/* Note for reviewers */}
               <div className="mb-6 p-3 bg-[#0A0E14] border border-[#1A2A3A] rounded-[8px] text-[12px] text-[#5A8AAA] text-left">
                 <strong>Mock Note:</strong> No email was actually sent. Click below to continue the simulated flow.
               </div>

               <Link to="/reset-password"
                 className="w-full flex items-center justify-center py-3 rounded-[10px] text-[15px] font-bold mono uppercase tracking-widest transition-all bg-[#1A1E1B] text-[#C8CEC8] border border-[#2A302B] hover:bg-[#242924]"
               >
                 Simulate Email Link →
               </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label htmlFor="forgot-email" className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono disabled:opacity-50"
                  placeholder="admin@iomt-testbed.local"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all disabled:opacity-60"
                style={{
                  background: loading ? "#8AB82A" : "#B6FF3B",
                  color: "#0C0F0D",
                  boxShadow: loading ? "none" : "0 0 20px rgba(182,255,59,0.25)",
                }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="text-center">
                <Link to="/login" className="text-[13px] font-medium text-[#94A8BA] hover:text-[#C8CEC8] transition-colors">
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 44/54: `src/screens/IncidentDetail.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts";
import { incidents, cases } from "../data/mock";
import { submitResponse } from "../api/apiService";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Screen } from "../types";

interface Props {
  tab: "overview" | "safereuse" | "response";
  onNavigate: (s: Screen) => void;
  onTabChange: (t: "overview" | "safereuse" | "response") => void;
}

// ── Severity helpers ──
function CritBadge({ c }: { c: string }) {
  const bg = c === "Critical" ? "rgba(245,56,56,0.12)" : c === "High" ? "rgba(232,101,12,0.12)" : "rgba(232,194,12,0.1)";
  const color = c === "Critical" ? "#F87171" : c === "High" ? "#FB923C" : "#FBBF24";
  const border = c === "Critical" ? "rgba(245,56,56,0.3)" : c === "High" ? "rgba(232,101,12,0.3)" : "rgba(232,194,12,0.25)";
  const bar = c === "Critical" ? "#F53838" : c === "High" ? "#E8650C" : "#E8C20C";
  return (
    <span className="badge" style={{ background: bg, color, borderColor: border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: bar }} />
      {c}
    </span>
  );
}

function OverviewTab({ inc }: { inc: any }) {
  return (
    <div className="space-y-4">
      {/* ── Investigation Summary ── */}
      <div className="card p-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
          Detection Evidence & Summary
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Description</div>
              <div className="text-[14px] leading-relaxed" style={{ color: "var(--text-2)" }}>{inc.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Source IP</div>
                <div className="text-[14px] mono font-semibold" style={{ color: "var(--text)" }}>{inc.sourceIp || "Multiple"}</div>
              </div>
              <div>
                <div className="text-[12px] mb-1" style={{ color: "var(--text-3)" }}>Protocol</div>
                <div className="text-[14px] mono font-semibold" style={{ color: "var(--text)" }}>{inc.protocol || "Unknown"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Detector Confidence", value: `${inc.confidence}%`, color: inc.confidence >= 90 ? "#1CC970" : "#F0A020" },
              { label: "Peak Rate", value: `${inc.packetsPerSec || 4218} pps`, color: "#F53838" },
              { label: "Detection Engine", value: inc.detectedBy || "XGBoost-v3", color: "var(--text)" },
              { label: "Assigned To", value: inc.assignee, color: "var(--text-2)", mono: false },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-[8px]" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>{s.label}</div>
                <div className={`text-[15px] ${s.mono !== false ? 'mono' : ''} font-bold`} style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="card p-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
          Incident Timeline
        </h2>
        <div className="flex gap-0 overflow-x-auto pb-2 scrollbar-thin">
          {[
            { t: "14:01:45", lbl: "Baseline Deviation" },
            { t: "14:02:00", lbl: "Attack Detected" },
            { t: "14:02:01", lbl: "Auto-Triage" },
            { t: "14:02:02", lbl: "Investigation Route" },
            { t: "14:02:04", lbl: "Response Proposed" },
            { t: "14:05:10", lbl: "Analyst Reviewed", dim: true },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center min-w-[100px]">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] mono mb-2 border-2"
                  style={{
                    background: step.dim ? "transparent" : "rgba(168,255,53,0.1)",
                    color: step.dim ? "var(--text-3)" : "var(--lime)",
                    borderColor: step.dim ? "var(--border-2)" : "var(--lime)",
                  }}
                >
                  T{i}
                </div>
                <div className="text-[12px] font-medium text-center leading-tight mb-1" style={{ color: step.dim ? "var(--text-3)" : "var(--text)" }}>{step.lbl}</div>
                <div className="text-[10px] mono" style={{ color: "var(--text-3)" }}>{step.t}</div>
              </div>
              {i < arr.length - 1 && (
                <div className="h-px flex-1 mt-3.5 mx-2" style={{ background: "var(--border-2)" }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function SafeReuseTab({ inc }: { inc: any }) {
  return (
    <div className="space-y-4">
      <div className="safety-notice mb-2">
        <strong>SAFE REUSE ANALYSIS</strong> — MediSOC attempts to safely reuse previous successful responses for similar attacks. This analysis compares the current incident against historical Case Memory to determine if a full manual investigation can be skipped.
      </div>
      
      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Comparison */}
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
            Contextual Comparison
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vector</th>
                <th>Current ({inc.id})</th>
                <th>Historical (CASE-017)</th>
                <th>Match Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { vec: "Attack Type", cur: inc.attack, hist: "MQTT Connect Flood", stat: "EXACT" },
                { vec: "Target Role", cur: "Gateway", hist: "Sensor", stat: "DEVIATION" },
                { vec: "Criticality", cur: inc.criticality, hist: "Medium", stat: "ESCALATED" },
                { vec: "Source IPs", cur: inc.sourceIp || "Multiple", hist: "Single", stat: "DEVIATION" },
              ].map(r => (
                <tr key={r.vec}>
                  <td className="font-medium">{r.vec}</td>
                  <td className="mono" style={{ color: "var(--text)" }}>{r.cur}</td>
                  <td className="mono">{r.hist}</td>
                  <td>
                    <span className="badge" style={{
                      background: r.stat === "EXACT" ? "rgba(28,201,112,0.1)" : "rgba(240,160,32,0.1)",
                      color: r.stat === "EXACT" ? "#1CC970" : "#F0A020",
                      borderColor: r.stat === "EXACT" ? "rgba(28,201,112,0.3)" : "rgba(240,160,32,0.3)",
                    }}>{r.stat}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Decision */}
        <div className="card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
              Routing Decision
            </h2>
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Selected Route</div>
              <div className="text-[20px] font-bold mono" style={{ color: "#F0A020" }}>PARTIAL</div>
            </div>
            <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
              Historical case memory (CASE-017) is 82% similar. However, target role differs (Gateway vs Sensor) and criticality is higher. Full automated reuse is unsafe. Partial manual review required.
            </div>
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between items-center text-[12px]">
              <span style={{ color: "var(--text-3)" }}>Historical Reliability</span>
              <span className="mono font-semibold" style={{ color: "#1CC970" }}>89%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResponseTab({ inc }: { inc: any }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(inc.status === "Resolved" || inc.status === "Closed");

  async function handleApprove() {
    setApproving(true);
    await submitResponse(inc.id, "MQTT Connection Rate Limiting", "admin@iomt-testbed.local");
    setApproving(false);
    setConfirmOpen(false);
    setApproved(true);
  }

  const responseData = [
    ...Array.from({ length: 10 }, (_, i) => ({ t: i, legit: 25 + Math.random() * 2, malicious: 0 })),
    ...Array.from({ length: 18 }, (_, i) => ({ t: i + 10, legit: Math.max(5, 20 - i * 0.5), malicious: 65 + Math.random() * 20 })),
    ...Array.from({ length: 20 }, (_, i) => ({ t: i + 28, legit: 16 + i * 0.45, malicious: Math.max(0, 28 - i * 1.6 + Math.random() * 2) })),
  ];

  return (
    <div className="space-y-4">
      {/* ── Healthcare safety notice ── */}
      <div className="alert-info text-[13px] flex gap-3 items-start">
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
          <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          <path d="M7 5.5v3M7 10v.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span>
          <strong className="font-semibold">RECOMMENDATION ONLY</strong> — No network action has been executed.
          This response must be explicitly approved by an authorized administrator before any containment step is applied to the network.
          Approved actions are logged in the Audit Log.
        </span>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Recommendation */}
        <div className="card p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
            Proposed Action
          </h2>
          <div className="text-[20px] font-bold mb-2" style={{ color: "var(--text)" }}>MQTT Connection Rate Limiting</div>
          <div className="text-[14px] mb-4" style={{ color: "var(--text-2)" }}>
            Apply a strict rate limit of 50 connections/sec at the upstream switch interface for Gateway-01. Duration: 120s. 
            This will suppress the flood while maintaining baseline clinical telemetry.
          </div>
          
          <div className="p-3 rounded-[8px] mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Policy Checks</div>
            <div className="space-y-1.5">
              {["Confidence threshold ≥ 0.90", "Device policy compliant", "Duration within bounds", "Clinical allowlist check passed"].map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px]">
                  <span style={{ color: "#1CC970" }}>✓</span>
                  <span style={{ color: "var(--text-3)" }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Authorization */}
        <div className="card p-5 flex flex-col">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>
            Authorization
          </h2>
          
          {approved ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded bg-[rgba(28,201,112,0.15)] flex items-center justify-center text-[11px] text-[#1CC970] font-bold">✓</span>
                <span className="text-[16px] font-bold" style={{ color: "#1CC970" }}>APPROVED & LOGGED</span>
              </div>
              <div className="text-[13px]" style={{ color: "var(--text-3)" }}>Response authorized and executed. Recorded in Audit Log.</div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>
                Review the recommendation and policy checks. Explicit authorization is required to modify network state.
              </div>
              <button
                onClick={() => setConfirmOpen(true)}
                className="btn btn-warning w-full py-2.5 font-bold uppercase tracking-widest mono text-[13px]"
              >
                Authorize Action →
              </button>
            </div>
          )}

          <ConfirmDialog
            open={confirmOpen}
            title="Authorize Response Action"
            variant="warning"
            confirmLabel={approving ? "Authorizing…" : "Authorize"}
            cancelLabel="Cancel"
            description={`You are about to authorize: MQTT Connection Rate Limiting for 120s on Gateway-01. This action will be recorded in the Audit Log under your identity.`}
            onConfirm={handleApprove}
            onCancel={() => setConfirmOpen(false)}
          >
            <div className="mt-3 px-3 py-2 rounded-[6px] text-[12px] mono" style={{ background: "var(--surface-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              <span className="text-[var(--warning)] font-bold">⚠ DEMO MODE:</span> This will NOT execute real network changes. It will simulate a successful response and record the audit event.
            </div>
          </ConfirmDialog>
        </div>
      </div>
      
      {/* Simulation Result / Chart */}
      {approved && (
        <div className="card p-5 fade-in">
           <div className="flex justify-between items-center mb-4">
             <div>
               <h2 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Response Outcome (Simulated)</h2>
               <div className="text-[13px]" style={{ color: "var(--text-3)" }}>Attack suppressed successfully. Legitimate traffic stabilized.</div>
             </div>
             <span className="badge" style={{ background: "rgba(28,201,112,0.1)", color: "#1CC970", borderColor: "rgba(28,201,112,0.3)" }}>SUCCESS</span>
           </div>
           
           <div className="h-[200px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={responseData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F53838" stopOpacity={0.2}/><stop offset="100%" stopColor="#F53838" stopOpacity={0}/></linearGradient>
                  <linearGradient id="lG3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1CC970" stopOpacity={0.15}/><stop offset="100%" stopColor="#1CC970" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="t" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "var(--text-3)" }} tickLine={false} axisLine={false}/>
                <ReferenceLine x={10} stroke="#F53838" strokeDasharray="3 3" strokeWidth={1} label={{ value: "Attack", position: "top", fontSize: 10, fill: "#F53838" }}/>
                <ReferenceLine x={28} stroke="#1CC970" strokeDasharray="3 3" strokeWidth={1} label={{ value: "Response", position: "top", fontSize: 10, fill: "#1CC970" }}/>
                <Area type="monotone" dataKey="malicious" stroke="#F53838" strokeWidth={1.5} fill="url(#rG)" dot={false}/>
                <Area type="monotone" dataKey="legit" stroke="#1CC970" strokeWidth={1.5} fill="url(#lG3)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
             {[
                { label: "Attack Suppression", value: "90%", color: "#1CC970" },
                { label: "Service Availability", value: "88%", color: "#1CC970" },
                { label: "Time to Contain", value: "14s", color: "var(--text)" },
                { label: "Recovery Time", value: "20s", color: "var(--text)" },
             ].map(m => (
               <div key={m.label} className="p-3 text-center rounded-[8px]" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                 <div className="text-[20px] font-bold mono" style={{ color: m.color }}>{m.value}</div>
                 <div className="text-[12px] mt-1" style={{ color: "var(--text-3)" }}>{m.label}</div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IncidentDetail({ tab, onNavigate, onTabChange }: Props) {
  // Use a hardcoded mock incident for demo (ideally would fetch based on URL params)
  const inc = incidents[0]; 

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate("incidents")}
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors mb-3"
            style={{ color: "var(--text-3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
          >
            ← Back to Incidents
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[28px] font-bold mono leading-none" style={{ color: "var(--text)" }}>{inc.id}</h1>
                <CritBadge c={inc.criticality} />
                <span className="badge" style={{ background: "rgba(139,114,240,0.1)", color: "#8B72F0", borderColor: "rgba(139,114,240,0.3)" }}>
                  {inc.type}
                </span>
              </div>
              <h2 className="text-[18px] font-medium" style={{ color: "var(--text-2)" }}>{inc.attack} on {inc.target}</h2>
              <div className="flex items-center gap-2 mt-2 text-[12px] mono" style={{ color: "var(--text-3)" }}>
                <span>Detected: {inc.time}</span>
                <span>•</span>
                <span>Route: {inc.route}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("device-detail")}>View Device Details</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-nav mb-6">
          {(["overview", "safereuse", "response"] as const).map(t => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className={`tab-btn ${tab === t ? "active" : ""}`}
            >
              {t === "safereuse" ? "Safe Reuse Analysis" : t === "response" ? "Response & Outcome" : "Investigation Overview"}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && <OverviewTab inc={inc} />}
        {tab === "safereuse" && <SafeReuseTab inc={inc} />}
        {tab === "response" && <ResponseTab inc={inc} />}
        
      </div>
    </div>
  );
}
```


################################################################################
### FILE 45/54: `src/screens/Incidents.tsx`
################################################################################

```tsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { incidents } from "../data/mock";
import { acknowledgeIncident, escalateIncident } from "../api/apiService";
import ConfirmDialog from "../components/ConfirmDialog";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

/* ── Severity & status helpers ───────────────────────────────────── */
function sevStyle(crit: string) {
  if (crit === "Critical") return { bg: "rgba(245,56,56,0.12)", text: "#F87171", bar: "#F53838", border: "rgba(245,56,56,0.3)" };
  if (crit === "High")     return { bg: "rgba(232,101,12,0.12)", text: "#FB923C", bar: "#E8650C", border: "rgba(232,101,12,0.3)" };
  if (crit === "Medium")   return { bg: "rgba(232,194,12,0.1)",  text: "#FBBF24", bar: "#E8C20C", border: "rgba(232,194,12,0.25)" };
  return                          { bg: "rgba(12,184,107,0.1)",  text: "#4ADE80", bar: "#0CB86B", border: "rgba(12,184,107,0.25)" };
}

function statusStyle(status: string) {
  if (status === "Investigating") return { bg: "rgba(245,56,56,0.1)",   color: "#F87171", label: "Investigating" };
  if (status === "Escalated")     return { bg: "rgba(240,160,32,0.12)", color: "#F0A020", label: "Escalated" };
  if (status === "Resolved")      return { bg: "rgba(28,201,112,0.1)",  color: "#1CC970", label: "Resolved" };
  if (status === "New")           return { bg: "rgba(12,154,232,0.1)",  color: "#0C9AE8", label: "New" };
  return                                 { bg: "rgba(78,130,160,0.1)", color: "#8EA5B0", label: status };
}

function routeStyle(route: string) {
  if (route === "SHORT")   return { color: "#1CC970", label: "Short" };
  if (route === "PARTIAL") return { color: "#F0A020", label: "Partial" };
  if (route === "DEEP")    return { color: "#8B72F0", label: "Deep" };
  return                          { color: "var(--text-2)", label: route };
}

function outcomeStyle(outcome: string) {
  if (outcome === "SUCCESS") return { color: "#1CC970", label: "Resolved" };
  if (outcome === "PARTIAL") return { color: "#F0A020", label: "Partial" };
  if (outcome === "FAILURE") return { color: "#F53838", label: "Failed" };
  if (outcome === "HARMFUL") return { color: "#F53838", label: "⚠ Harmful" };
  return                            { color: "var(--text-2)", label: outcome };
}

/* ── Search highlight ─────────────────────────────────────────────── */
function Hl({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: "rgba(168,255,53,0.15)", color: "#A8FF35", borderRadius: 2, padding: "0 2px" }}>
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

/* ── Row actions ────────────────────────────────────────────────────── */
function RowActions({ incId }: { incId: string }) {
  const [ackOpen, setAckOpen]   = useState(false);
  const [escOpen, setEscOpen]   = useState(false);
  const [ackDone, setAckDone]   = useState(false);
  const [escDone, setEscDone]   = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleAck() {
    setLoading(true);
    await acknowledgeIncident(incId, "Acknowledged by analyst");
    setLoading(false);
    setAckOpen(false);
    setAckDone(true);
  }
  async function handleEsc() {
    setLoading(true);
    await escalateIncident(incId, "Escalated for senior review");
    setLoading(false);
    setEscOpen(false);
    setEscDone(true);
  }

  return (
    <>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          title={ackDone ? "Acknowledged" : "Acknowledge incident"}
          disabled={ackDone}
          onClick={e => { e.stopPropagation(); setAckOpen(true); }}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-[4px] border transition-all disabled:opacity-50 mono"
          style={{
            background: ackDone ? "rgba(28,201,112,0.1)" : "var(--surface-3)",
            borderColor: ackDone ? "rgba(28,201,112,0.3)" : "var(--border-2)",
            color: ackDone ? "#1CC970" : "var(--text-3)",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5l2.5 2.5 3.5-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {ackDone ? "ACK'd" : "ACK"}
        </button>
        <button
          title={escDone ? "Escalated" : "Escalate to senior analyst"}
          disabled={escDone}
          onClick={e => { e.stopPropagation(); setEscOpen(true); }}
          className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-[4px] border transition-all disabled:opacity-50 mono"
          style={{
            background: escDone ? "rgba(240,160,32,0.1)" : "var(--surface-3)",
            borderColor: escDone ? "rgba(240,160,32,0.3)" : "var(--border-2)",
            color: escDone ? "#F0A020" : "var(--text-3)",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 7.5V2M2 4l2.5-2.5L7 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {escDone ? "ESC'd" : "ESC"}
        </button>
      </div>

      <ConfirmDialog
        open={ackOpen}
        title={`Acknowledge ${incId}`}
        variant="info"
        confirmLabel={loading ? "Acknowledging…" : "Acknowledge"}
        cancelLabel="Cancel"
        description={`Confirm you have reviewed incident ${incId}. This action will be recorded in the Audit Log.`}
        onConfirm={handleAck}
        onCancel={() => setAckOpen(false)}
      />
      <ConfirmDialog
        open={escOpen}
        title={`Escalate ${incId}`}
        variant="warning"
        confirmLabel={loading ? "Escalating…" : "Escalate"}
        cancelLabel="Cancel"
        description={`Escalate incident ${incId} to a senior analyst or administrator. This action will be recorded in the Audit Log.`}
        onConfirm={handleEsc}
        onCancel={() => setEscOpen(false)}
      />
    </>
  );
}

type SortKey = "confidence" | "time" | "criticality";
const CRIT_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const PAGE_SIZE = 8;

const SAVED_VIEWS = [
  { label: "Active incidents",      status: "Investigating", crit: "All", route: "All", outcome: "All" },
  { label: "Critical unresolved",   status: "All",           crit: "Critical", route: "All", outcome: "All" },
  { label: "Deep investigations",   status: "All",           crit: "All", route: "DEEP", outcome: "All" },
];

export default function Incidents({ onNavigate }: Props) {
  const [search, setSearch]             = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterCrit, setFilterCrit]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRoute, setFilterRoute]   = useState("All");
  const [filterOutcome, setFilterOutcome] = useState("All");
  const [sortKey, setSortKey]           = useState<SortKey>("time");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("desc");
  const [page, setPage]                 = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "time" ? "desc" : "asc"); }
  }

  // Quick search preview
  const previewResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return incidents.filter(x =>
      x.id.toLowerCase().includes(q) ||
      x.attack.toLowerCase().includes(q) ||
      x.target.toLowerCase().includes(q) ||
      x.type.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [search]);

  const filtered = useMemo(() => {
    let d = [...incidents];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(x =>
        x.id.toLowerCase().includes(q) ||
        x.attack.toLowerCase().includes(q) ||
        x.target.toLowerCase().includes(q) ||
        x.type.toLowerCase().includes(q)
      );
    }
    if (filterCrit !== "All")    d = d.filter(x => x.criticality === filterCrit);
    if (filterStatus !== "All")  d = d.filter(x => x.status === filterStatus);
    if (filterRoute !== "All")   d = d.filter(x => x.route === filterRoute);
    if (filterOutcome !== "All") d = d.filter(x => x.outcome === filterOutcome);
    d.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "confidence")  cmp = a.confidence - b.confidence;
      else if (sortKey === "time")   cmp = a.time.localeCompare(b.time);
      else if (sortKey === "criticality") cmp = (CRIT_ORDER[a.criticality] ?? 4) - (CRIT_ORDER[b.criticality] ?? 4);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return d;
  }, [search, filterCrit, filterStatus, filterRoute, filterOutcome, sortKey, sortDir]);

  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const hasActiveFilters = filterCrit !== "All" || filterStatus !== "All" || filterRoute !== "All" || filterOutcome !== "All" || search;

  function clearFilters() {
    setFilterCrit("All");
    setFilterStatus("All");
    setFilterRoute("All");
    setFilterOutcome("All");
    setSearch("");
    setPage(0);
  }

  function SortTh({ label, sk }: { label: string; sk: SortKey }) {
    const isActive = sortKey === sk;
    return (
      <th className="px-4 py-2.5 text-left">
        <button
          className="flex items-center gap-1 text-[11px] font-semibold mono uppercase tracking-widest transition-colors"
          style={{ color: isActive ? "var(--text)" : "var(--text-3)" }}
          onClick={() => handleSort(sk)}
        >
          {label}
          <span className="text-[10px] opacity-60 ml-0.5">
            {isActive ? (sortDir === "asc" ? "↑" : "↓") : "⇅"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="px-6 py-5 max-w-[1440px] mx-auto">

        {/* ─── Page header ─── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "var(--text)" }}>Incidents</h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
              Security incidents detected on this session · Demonstration data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[12px] mono px-2.5 py-1 rounded-[6px]"
              style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}
            >
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ─── Search with live dropdown ─── */}
        <div className="relative mb-3" ref={searchRef}>
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="var(--text-3)" strokeWidth="1.2"/>
            <path d="M10 10l2.5 2.5" stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); setDropdownOpen(true); }}
            onFocus={() => { if (search) setDropdownOpen(true); }}
            onKeyDown={e => {
              if (e.key === "Enter") setDropdownOpen(false);
              if (e.key === "Escape") { setSearch(""); setDropdownOpen(false); }
            }}
            placeholder="Search incidents — ID, attack type, target device…"
            className="w-full pl-10 pr-9 py-2.5 text-[13px] transition-colors"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text)",
              outline: "none",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--border-3)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          {search && (
            <button
              onMouseDown={e => { e.preventDefault(); setSearch(""); setDropdownOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-[14px]"
              style={{ color: "var(--text-3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              ✕
            </button>
          )}

          {/* Live search dropdown */}
          {dropdownOpen && search && (
            <div
              className="absolute top-full left-0 right-0 z-50 mt-1 rounded-[10px] shadow-2xl overflow-hidden"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}
            >
              {previewResults.length === 0 ? (
                <div className="px-4 py-4 text-[13px]" style={{ color: "var(--text-3)" }}>
                  No incidents match "{search}"
                </div>
              ) : (
                <>
                  <div
                    className="px-4 py-2 border-b text-[11px] mono uppercase tracking-widest"
                    style={{ borderColor: "var(--border)", color: "var(--text-3)" }}
                  >
                    {previewResults.length} match{previewResults.length !== 1 ? "es" : ""}
                  </div>
                  {previewResults.map(inc => {
                    const sv = sevStyle(inc.criticality);
                    return (
                      <button
                        key={inc.id}
                        onMouseDown={e => { e.preventDefault(); setSearch(inc.id); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b last:border-b-0 transition-colors"
                        style={{ borderColor: "var(--border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-3)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div className="w-1 h-9 rounded-full shrink-0" style={{ background: sv.bar }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] mono font-semibold" style={{ color: "var(--text)" }}>
                              <Hl text={inc.id} q={search} />
                            </span>
                            <span className="badge" style={{ background: sv.bg, color: sv.text, borderColor: sv.border }}>
                              {inc.criticality}
                            </span>
                          </div>
                          <div className="text-[12px] truncate mt-0.5" style={{ color: "var(--text-2)" }}>
                            <Hl text={inc.attack} q={search} />
                          </div>
                          <div className="text-[11px] mono" style={{ color: "var(--text-3)" }}>
                            <Hl text={inc.target} q={search} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[12px] mono" style={{ color: "var(--text-3)" }}>{inc.confidence}%</div>
                          <div className="text-[11px]" style={{ color: "var(--text-3)" }}>{inc.time}</div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── Filters ─── */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Severity filters */}
          <div className="flex items-center gap-1">
            {(["All", "Critical", "High", "Medium", "Low"] as const).map(c => {
              const sv = c !== "All" ? sevStyle(c) : null;
              return (
                <button
                  key={c}
                  onClick={() => { setFilterCrit(c); setPage(0); }}
                  className="filter-chip"
                  style={{
                    background: filterCrit === c && sv ? sv.bg : filterCrit === c ? "var(--surface-3)" : "transparent",
                    color: filterCrit === c && sv ? sv.text : filterCrit === c ? "var(--text)" : "var(--text-3)",
                    borderColor: filterCrit === c && sv ? sv.border : filterCrit === c ? "var(--border-2)" : "var(--border)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4" style={{ background: "var(--border)" }} />

          {/* Status filters */}
          <div className="flex items-center gap-1">
            {(["All", "Investigating", "Escalated", "Resolved"] as const).map(s => {
              const ss = s !== "All" ? statusStyle(s) : null;
              return (
                <button
                  key={s}
                  onClick={() => { setFilterStatus(s); setPage(0); }}
                  className="filter-chip"
                  style={{
                    background: filterStatus === s && ss ? ss.bg : filterStatus === s ? "var(--surface-3)" : "transparent",
                    color: filterStatus === s && ss ? ss.color : filterStatus === s ? "var(--text)" : "var(--text-3)",
                    borderColor: filterStatus === s ? "var(--border-2)" : "var(--border)",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4" style={{ background: "var(--border)" }} />

          {/* Route filters */}
          <div className="flex items-center gap-1">
            {(["All", "SHORT", "PARTIAL", "DEEP"] as const).map(r => (
              <button
                key={r}
                onClick={() => { setFilterRoute(r); setPage(0); }}
                className="filter-chip mono"
                style={{
                  background: filterRoute === r ? "var(--surface-3)" : "transparent",
                  color: filterRoute === r ? "var(--text)" : "var(--text-3)",
                  borderColor: filterRoute === r ? "var(--border-2)" : "var(--border)",
                }}
              >
                {r === "All" ? "All routes" : r}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-[12px] px-2.5 py-1 rounded-[6px] border transition-colors"
              style={{ color: "var(--text-3)", borderColor: "var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Saved views */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[12px]" style={{ color: "var(--text-3)" }}>Quick views:</span>
          {SAVED_VIEWS.map(v => (
            <button
              key={v.label}
              onClick={() => {
                setFilterStatus(v.status);
                setFilterCrit(v.crit);
                setFilterRoute(v.route);
                setFilterOutcome(v.outcome);
                setPage(0);
              }}
              className="text-[12px] px-2.5 py-1 rounded-[6px] border transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text-3)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-3)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)";
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-3 text-[12px]">
            <span style={{ color: "var(--text-3)" }}>Active:</span>
            {search && (
              <span className="px-2 py-0.5 rounded-[4px]" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                "{search}"
              </span>
            )}
            {filterCrit !== "All" && (
              <span className="px-2 py-0.5 rounded-[4px]" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                Severity: {filterCrit}
              </span>
            )}
            {filterStatus !== "All" && (
              <span className="px-2 py-0.5 rounded-[4px]" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                Status: {filterStatus}
              </span>
            )}
            {filterRoute !== "All" && (
              <span className="px-2 py-0.5 rounded-[4px]" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                Route: {filterRoute}
              </span>
            )}
          </div>
        )}

        {/* ─── Incidents table ─── */}
        <div
          className="overflow-hidden mb-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest w-[110px]" style={{ color: "var(--text-3)" }}>ID</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Attack</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Target</th>
                <SortTh label="Severity" sk="criticality" />
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Status</th>
                <SortTh label="Confidence" sk="confidence" />
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Route</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold mono uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Outcome</th>
                <SortTh label="Time" sk="time" />
                <th className="px-4 py-2.5 w-[110px]" />
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-[14px]" style={{ color: "var(--text-3)" }}>
                    <div>No incidents match the current filters.</div>
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-[13px] underline transition-colors"
                      style={{ color: "var(--text-3)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : pageItems.map((inc, i) => {
                const sv = sevStyle(inc.criticality);
                const st = statusStyle(inc.status);
                const rt = routeStyle(inc.route);
                const out = outcomeStyle(inc.outcome);
                const lowConf = inc.confidence < 90;

                return (
                  <tr
                    key={inc.id}
                    className="border-b cursor-pointer transition-colors group"
                    style={{
                      borderColor: "var(--border)",
                      borderLeft: `3px solid ${sv.bar}`,
                      borderBottom: i < pageItems.length - 1 ? `1px solid var(--border)` : "none",
                    }}
                    onClick={() => onNavigate("incident-overview")}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="text-[13px] mono font-semibold" style={{ color: "var(--text)" }}>{inc.id}</div>
                      <div className="text-[11px] mono mt-0.5" style={{ color: "var(--text-3)" }}>{inc.type}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium" style={{ color: "var(--text-2)" }}>{inc.attack}</div>
                    </td>
                    <td className="px-4 py-3 mono text-[12px]" style={{ color: "var(--text-3)" }}>
                      {inc.target}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge" style={{ background: sv.bg, color: sv.text, borderColor: sv.border }}>
                        <span className="w-1 h-1 rounded-full" style={{ background: sv.bar }} />
                        {inc.criticality}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[11px] font-semibold mono px-2 py-0.5 rounded-[4px]"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {lowConf && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" title="Below 90% threshold">
                            <path d="M5 1L9 8.5H1L5 1Z" stroke="#F0A020" strokeWidth="1" strokeLinejoin="round"/>
                            <path d="M5 4.5v2" stroke="#F0A020" strokeWidth="1" strokeLinecap="round"/>
                          </svg>
                        )}
                        <span className="text-[13px] mono font-semibold" style={{ color: lowConf ? "#F0A020" : "var(--text)" }}>
                          {inc.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-semibold mono" style={{ color: rt.color }}>{rt.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-medium" style={{ color: out.color }}>{out.label}</span>
                    </td>
                    <td className="px-4 py-3 mono text-[12px]" style={{ color: "var(--text-3)" }}>
                      {inc.time}
                    </td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <RowActions incId={inc.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        <div className="flex items-center justify-between text-[12px] mono" style={{ color: "var(--text-3)" }}>
          <div className="flex items-center gap-3">
            <span>
              Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            {filtered.some(i => i.confidence < 90) && (
              <span className="flex items-center gap-1" style={{ color: "#7A6030" }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M4.5 1L8.5 8H0.5L4.5 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                </svg>
                {filtered.filter(i => i.confidence < 90).length} below 90% confidence
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-2.5 py-1 border rounded-[5px] disabled:opacity-30 transition-colors"
                style={{ borderColor: "var(--border)" }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-3)"; }}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                ←
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className="px-2.5 py-1 border rounded-[5px] transition-colors"
                  style={{
                    borderColor: page === i ? "var(--border-3)" : "var(--border)",
                    color: page === i ? "var(--text)" : "var(--text-3)",
                    background: page === i ? "var(--surface-3)" : "transparent",
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-2.5 py-1 border rounded-[5px] disabled:opacity-30 transition-colors"
                style={{ borderColor: "var(--border)" }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-3)"; }}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 46/54: `src/screens/Login.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@iomt-testbed.local");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pass) { setError("Please enter your email and password."); return; }
    setError(null);
    setLoading(true);
    const result = await login(email.trim(), pass);
    setLoading(false);
    if (!result.success) setError(result.error ?? "Login failed.");
    // On success, AuthContext updates → App re-renders to authenticated shell
  }

  return (
    <div className="min-h-screen bg-[#0C0F0D] flex items-center justify-center relative overflow-hidden">
      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#B6FF3B" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Cyber Network Mesh Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-30"
        style={{
          backgroundImage: "url('/cyber-network-bg.png')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050706]/70 via-[#050706]/40 to-[#050706] pointer-events-none" />

      <div className="relative w-full max-w-[480px] px-6 fade-in">
        {/* Brand */}
        <div className="mb-8 text-center flex flex-col items-center">
          <Logo size="xl" clickable to="/" />
          <p className="text-[16px] text-white/90 mt-2 font-semibold">Healthcare Cybersecurity SOC Portal</p>
          <Link
            to="/"
            className="text-[14px] font-mono text-[var(--lime)] hover:underline mt-2 inline-flex items-center gap-1 font-bold"
          >
            ← Return to Public Website
          </Link>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#111511] border border-[#242924] rounded-[20px] p-8 shadow-[0_12px_50px_rgba(0,0,0,0.7)]"
          noValidate
        >
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-[10px] text-[16px]"
              style={{ background: "#1C0808", border: "1px solid #3A1010", color: "#F87171" }}>
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-6">
            <label
              htmlFor="login-email"
              className="block text-[15px] font-bold text-white uppercase tracking-wider mb-2"
            >
              Email / Username
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3.5 rounded-xl border border-[#242924] text-[18px] text-white bg-[#0C0F0D] focus:outline-none focus:border-[var(--lime)] transition-colors mono disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div className="mb-7">
            <label
              htmlFor="login-password"
              className="block text-[15px] font-bold text-white uppercase tracking-wider mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                disabled={loading}
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 rounded-xl border border-[#242924] text-[18px] text-white bg-[#0C0F0D] focus:outline-none focus:border-[var(--lime)] transition-colors mono pr-12 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1"
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[18px] font-extrabold mono uppercase tracking-widest transition-all disabled:opacity-60 bg-[var(--lime)] text-black hover:bg-[#b5ff4d] shadow-[0_0_20px_rgba(168,255,53,0.3)]"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#0C0F0D" strokeWidth="2" strokeOpacity="0.3"/>
                  <path d="M7 2a5 5 0 015 5" stroke="#0C0F0D" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Authenticating…
              </>
            ) : "Sign In"}
          </button>

          <div className="flex items-center justify-between mt-5">
             <Link to="/forgot-password" className="text-[15px] font-medium text-white/90 hover:text-[var(--lime)] transition-colors">
               Forgot Password?
             </Link>
             <Link to="/accept-invitation" className="text-[15px] font-medium text-white/90 hover:text-[var(--lime)] transition-colors">
               Accept Invitation
             </Link>
          </div>

          <p className="text-center text-[14px] text-white/70 mt-5 mono">
            Authorized access only · Account provisioning by administrator only
          </p>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 px-5 py-4 rounded-[12px] text-[15px] mono"
          style={{ background: "#111713", border: "1px solid var(--border)", color: "#FFFFFF" }}>
          <div className="mb-2 text-[12px] uppercase tracking-widest text-[var(--lime)] font-bold">DEMO CREDENTIALS</div>
          <div className="text-white"><span className="text-white font-medium">admin@iomt-testbed.local</span> · <span className="text-[var(--lime)] font-bold">admin123</span></div>
          <div className="text-white mt-1"><span className="text-white font-medium">analyst@iomt-testbed.local</span> · <span className="text-[var(--lime)] font-bold">analyst123</span></div>
        </div>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 47/54: `src/screens/Reports.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import type { Screen } from "../types";

interface Props { onNavigate: (s: Screen) => void; }

export default function Reports({ onNavigate }: Props) {
  const [reportType, setReportType] = useState("incidents");
  const [timeRange, setTimeRange] = useState("7d");

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[20px] font-bold" style={{ color: "var(--text)" }}>Reports & Export</h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
             Generate compliance reports and export incident data.
          </p>
        </div>

        <div className="grid grid-cols-[300px_1fr] gap-6">
           {/* Sidebar Options */}
           <div className="space-y-4">
              <div className="card p-4">
                 <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Report Type</div>
                 <div className="space-y-1">
                    {[
                      { id: "incidents", label: "Incident Summary" },
                      { id: "compliance", label: "Compliance (HIPAA)" },
                      { id: "devices", label: "Asset Risk Posture" },
                      { id: "audit", label: "Full Audit Export" },
                    ].map(r => (
                       <button
                         key={r.id}
                         onClick={() => setReportType(r.id)}
                         className="w-full text-left px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors"
                         style={{ 
                            background: reportType === r.id ? "var(--surface-3)" : "transparent",
                            color: reportType === r.id ? "var(--text)" : "var(--text-3)"
                         }}
                       >
                         {r.label}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="card p-4">
                 <div className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-3)", fontFamily: "JetBrains Mono" }}>Time Range</div>
                 <div className="space-y-1">
                    {[
                      { id: "24h", label: "Last 24 Hours" },
                      { id: "7d", label: "Last 7 Days" },
                      { id: "30d", label: "Last 30 Days" },
                      { id: "custom", label: "Custom Range..." },
                    ].map(r => (
                       <button
                         key={r.id}
                         onClick={() => setTimeRange(r.id)}
                         className="w-full text-left px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors"
                         style={{ 
                            background: timeRange === r.id ? "var(--surface-3)" : "transparent",
                            color: timeRange === r.id ? "var(--text)" : "var(--text-3)"
                         }}
                       >
                         {r.label}
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* Preview / Action */}
           <div className="card p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-[12px] flex items-center justify-center mb-6" style={{ background: "rgba(168,255,53,0.1)", color: "var(--lime)" }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                 </svg>
              </div>
              <h2 className="text-[18px] font-semibold mb-2" style={{ color: "var(--text)" }}>Report Preview</h2>
              <p className="text-[13px] mb-8 max-w-[300px]" style={{ color: "var(--text-3)" }}>
                 Generating a '{reportType}' report for the selected time range. The export will be available in CSV and PDF formats.
              </p>
              
              <div className="flex gap-3">
                 <button className="btn btn-secondary px-6">Preview</button>
                 <button className="btn btn-primary px-6">Export PDF</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 48/54: `src/screens/ResetPassword.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple password strength check
  const isStrong = pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pass || !confirm) { setError("Please fill in both fields."); return; }
    if (pass !== confirm) { setError("Passwords do not match."); return; }
    if (!isStrong) { setError("Password does not meet requirements."); return; }
    
    setError(null);
    setLoading(true);

    const result = await resetPassword(pass);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Reset failed.");
      return;
    }

    setSuccess(true);
  }

  return (
    <div className="min-h-screen bg-[#0C0F0D] flex items-center justify-center relative overflow-hidden">
      {/* Background decorations matching Login */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#B6FF3B" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#B6FF3B] opacity-[0.03] blur-[120px] pointer-events-none"/>

      <div className="relative w-full max-w-[400px] px-6 fade-in">
        <div className="mb-8 text-center">
          <h1 className="font-bold text-[32px] text-[#E8EDE9] leading-snug tracking-tight">Set New Password</h1>
          <p className="text-[15px] text-[#94A8BA] mt-2">Enter a new secure password for your account.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111511] border border-[#242924] rounded-[16px] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
          noValidate
        >
          {error && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-5 rounded-[8px] text-[14px]"
              style={{ background: "#1C0808", border: "1px solid #3A1010", color: "#F87171" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-[#14291A] border border-[#1A3D22] rounded-full mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </div>
               <div className="text-[17px] font-semibold text-[#E8EDE9] mb-2">Password Updated</div>
               <div className="text-[14px] text-[#94A8BA] mb-6">
                 Your password has been successfully reset. You can now use it to sign in.
                 <br/><br/>
                 <span className="text-[#5A8AAA] text-[12px]"><strong>Mock Note:</strong> The Admin account password was updated in-memory for this session. Refreshing the browser resets the demo.</span>
               </div>
               
               <Link to="/login"
                 className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all bg-[#B6FF3B] text-[#0C0F0D]"
               >
                 Proceed to Sign In
               </Link>
            </div>
          ) : (
            <>
              {/* Password */}
              <div className="mb-4">
                <label className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono pr-10 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A8BA] hover:text-[#C8CEC8]"
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Password strength indicators */}
              <div className="flex gap-2 mb-4">
                <div className={`h-1.5 flex-1 rounded-full ${pass.length >= 8 ? 'bg-[#22C55E]' : 'bg-[#242924]'}`}/>
                <div className={`h-1.5 flex-1 rounded-full ${/[A-Z]/.test(pass) ? 'bg-[#22C55E]' : 'bg-[#242924]'}`}/>
                <div className={`h-1.5 flex-1 rounded-full ${/[0-9]/.test(pass) ? 'bg-[#22C55E]' : 'bg-[#242924]'}`}/>
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-[12px] font-semibold text-[#94A8BA] uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#242924] text-[16px] text-[#E8EDE9] bg-[#0C0F0D] focus:outline-none focus:border-[#B6FF3B] transition-colors mono pr-10 disabled:opacity-50"
                  />
                  {confirm.length > 0 && confirm === pass && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22C55E]">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all disabled:opacity-60"
                style={{
                  background: loading ? "#8AB82A" : "#B6FF3B",
                  color: "#0C0F0D",
                  boxShadow: loading ? "none" : "0 0 20px rgba(182,255,59,0.25)",
                }}
              >
                {loading ? "Saving..." : "Update Password"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 49/54: `src/screens/SystemHealth.tsx`
################################################################################

```tsx
import React, { useState } from "react";
import { services } from "../data/mock";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";

interface Props {
  onNavigate: (s: Screen) => void;
}

// ── Icons ──
const serviceIcons: Record<string, React.ReactNode> = {
  "Edge Gateway": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="5" width="14" height="8" rx="2" />
      <path d="M6 9h6M9 7v4" strokeLinecap="round" />
    </svg>
  ),
  "Detector": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="9" cy="9" r="6" />
      <path d="M6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "Controller": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M3 6h12M3 9h8M3 12h6" strokeLinecap="round" />
    </svg>
  ),
  "Case Memory": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="3" y="3" width="12" height="12" rx="2" />
      <path d="M6 7h6M6 10h4" strokeLinecap="round" />
    </svg>
  ),
  "MQTT Broker": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M2 9h2M14 9h2M9 2v2M9 14v2M4.93 4.93l1.41 1.41M11.66 11.66l1.41 1.41M4.93 13.07l1.41-1.41M11.66 6.34l1.41-1.41" strokeLinecap="round" />
      <circle cx="9" cy="9" r="2.5" />
    </svg>
  ),
  "Database": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
      <ellipse cx="9" cy="5.5" rx="6" ry="2.5" />
      <path d="M3 5.5v7c0 1.38 2.69 2.5 6 2.5s6-1.12 6-2.5v-7" />
      <path d="M3 9c0 1.38 2.69 2.5 6 2.5S15 10.38 15 9" />
    </svg>
  ),
};

function Toggle({ label, sub, checked, onChange, disabled }: any) {
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
      <div>
        <div className="text-[14px] font-medium text-white">{label}</div>
        {sub && <div className="text-[12px] mt-0.5 text-white/60">{sub}</div>}
      </div>
      <button
        type="button"
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{
          background: checked ? "var(--lime)" : "#1E2621",
          border: checked ? "1px solid var(--lime)" : "1px solid #2B3830",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all shadow-sm"
          style={{
            background: checked ? "#0C0F0D" : "#718578",
            left: checked ? "calc(100% - 18px)" : "3px",
          }}
        />
      </button>
    </div>
  );
}

export default function SystemHealth({ onNavigate }: Props) {
  const { user, changePassword } = useAuth();
  const [tab, setTab] = useState<"health" | "settings" | "security">("settings");

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Settings Toggles State
  const [activeContainment, setActiveContainment] = useState(true);
  const [autoCritical, setAutoCritical] = useState(false);
  const [caseMemoryReuse, setCaseMemoryReuse] = useState(true);
  const [allowlistCheck, setAllowlistCheck] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [auditExport, setAuditExport] = useState(true);

  // Password strength calculation
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const strengthScore = [hasMinLength, hasNumber, hasUpper, hasSpecial].filter(Boolean).length;

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!currentPassword) {
      setPassError("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setPassError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("New password and confirmation do not match.");
      return;
    }

    setPassLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPassSuccess("Password updated successfully! Your next login will use your new password.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPassError(res.error || "Failed to update password. Please verify current password.");
      }
    } catch (err: any) {
      setPassError(err.message || "An unexpected error occurred.");
    } finally {
      setPassLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#070908] text-white p-6 lg:p-8 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-mono font-bold tracking-widest text-[#A8FF35] uppercase mb-1">
              SYSTEM CONFIGURATION & SECURITY
            </div>
            <h1 className="text-[28px] lg:text-[32px] font-bold text-white tracking-tight">
              System & Settings
            </h1>
            <p className="text-[14px] text-white/60 mt-1">
              Manage MediSOC telemetry services, automated response policies, and user account security.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1CC970] animate-pulse" />
            <span className="text-[13px] font-mono font-bold text-[#1CC970]">ALL MICROSERVICES NOMINAL</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#1B261F] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-all whitespace-nowrap ${
              tab === "settings"
                ? "bg-[#16211A] text-[#A8FF35] border border-[#23382B]"
                : "text-white/70 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            System Settings
          </button>
          <button
            type="button"
            onClick={() => setTab("security")}
            className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              tab === "security"
                ? "bg-[#16211A] text-[#A8FF35] border border-[#23382B]"
                : "text-white/70 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <span>Change Password & Security</span>
            <span className="w-2 h-2 rounded-full bg-[#A8FF35]" />
          </button>
          <button
            type="button"
            onClick={() => setTab("health")}
            className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-all whitespace-nowrap ${
              tab === "health"
                ? "bg-[#16211A] text-[#A8FF35] border border-[#23382B]"
                : "text-white/70 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            Service Health Telemetry
          </button>
        </div>

        {/* TAB 1: CHANGE PASSWORD & ACCOUNT SECURITY */}
        {tab === "security" && (
          <div className="space-y-6">
            
            {/* User Profile Overview */}
            <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl">
              <h2 className="text-[17px] font-semibold text-white mb-4">
                Active User Profile
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div className="text-[11px] font-mono uppercase text-white/50 mb-1">User Account</div>
                  <div className="text-[15px] font-bold text-white">{user?.name ?? "SOC Super Admin"}</div>
                  <div className="text-[13px] text-[#A8FF35] font-mono mt-0.5">{user?.email ?? "admin@iomt-testbed.local"}</div>
                </div>

                <div className="p-4 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div className="text-[11px] font-mono uppercase text-white/50 mb-1">Access Role</div>
                  <div className="text-[15px] font-bold text-white capitalize">{user?.role?.replace("_", " ") ?? "Super Admin"}</div>
                  <div className="text-[12px] text-white/60 mt-0.5">Full SOC & Lab Simulation Permissions</div>
                </div>

                <div className="p-4 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div className="text-[11px] font-mono uppercase text-white/50 mb-1">Session Status</div>
                  <div className="text-[15px] font-bold text-[#1CC970] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1CC970]" />
                    Authenticated & Verified
                  </div>
                  <div className="text-[12px] text-white/60 mt-0.5">Token valid · TLS 1.3 encrypted</div>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl max-w-[760px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#16211A] border border-[#23382B] flex items-center justify-center text-[#A8FF35]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-white">
                    Change Account Password
                  </h2>
                  <p className="text-[13px] text-white/60">
                    Update your MediSOC login credentials to secure your analyst session.
                  </p>
                </div>
              </div>

              {/* Success Banner */}
              {passSuccess && (
                <div className="mb-6 p-4 rounded-lg bg-[#0D2415] border border-[#1CC970]/40 text-[#1CC970] text-[14px] flex items-start gap-3">
                  <span className="text-[18px]">✓</span>
                  <div>
                    <div className="font-bold">Password Updated Successfully</div>
                    <div className="text-[13px] text-white/80 mt-0.5">{passSuccess}</div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {passError && (
                <div className="mb-6 p-4 rounded-lg bg-[#2D1212] border border-[#FF5555]/40 text-[#FF5555] text-[14px] flex items-start gap-3">
                  <span className="text-[18px]">⚠️</span>
                  <div>
                    <div className="font-bold">Password Update Error</div>
                    <div className="text-[13px] text-white/80 mt-0.5">{passError}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                
                {/* Current Password */}
                <div>
                  <label className="block text-[12px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password (e.g. admin123)"
                      className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#A8FF35] transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors text-[12px] font-mono"
                    >
                      {showCurrent ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                  <span className="text-[11px] text-white/40 mt-1 block">
                    Default demo passwords: <code className="text-[#A8FF35]">admin123</code> (Admin), <code className="text-[#A8FF35]">analyst123</code> (Analyst).
                  </span>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[12px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 chars)"
                      className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#A8FF35] transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors text-[12px] font-mono"
                    >
                      {showNew ? "HIDE" : "SHOW"}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-white/60">Password Strength:</span>
                        <span className={
                          strengthScore <= 1 ? "text-red-400 font-bold" :
                          strengthScore <= 2 ? "text-yellow-400 font-bold" :
                          "text-[#A8FF35] font-bold"
                        }>
                          {strengthScore <= 1 ? "Weak" : strengthScore <= 2 ? "Moderate" : "Strong"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#080B09] rounded-full overflow-hidden border border-[#1B261F]">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            strengthScore <= 1 ? "w-1/3 bg-red-500" :
                            strengthScore <= 2 ? "w-2/3 bg-yellow-400" :
                            "w-full bg-[#A8FF35]"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[12px] font-mono font-bold uppercase tracking-wider text-white/70 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-[#080B09] border border-[#1B261F] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#A8FF35] transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors text-[12px] font-mono"
                    >
                      {showConfirm ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <span className="text-[12px] text-red-400 mt-1 block font-mono">
                      Passwords do not match
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex items-center justify-between border-t border-[#1B261F]">
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="px-6 py-2.5 rounded-lg bg-[#A8FF35] hover:bg-[#b5ff4d] text-black font-extrabold text-[14px] transition-all shadow-[0_0_20px_rgba(168,255,53,0.25)] active:scale-95 disabled:opacity-50"
                  >
                    {passLoading ? "Updating Password..." : "Save New Password"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPassError(null);
                      setPassSuccess(null);
                    }}
                    className="text-[13px] text-white/50 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>

            {/* 2FA & Session Security Card */}
            <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl max-w-[760px]">
              <h3 className="text-[16px] font-semibold text-white mb-4">
                Two-Factor Authentication & Access Security
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div>
                    <div className="text-[14px] font-bold text-white">Two-Factor Authentication (2FA)</div>
                    <div className="text-[12px] text-white/60">Enforce TOTP authenticator token on analyst login</div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-[rgba(168,255,53,0.1)] text-[#A8FF35] border border-[#A8FF35]/30">
                    ENABLED
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#080B09] border border-[#1B261F]">
                  <div>
                    <div className="text-[14px] font-bold text-white">Auto Session Inactivity Timeout</div>
                    <div className="text-[12px] text-white/60">Automatically locks terminal after 15 minutes of inactivity</div>
                  </div>
                  <span className="text-[12px] font-mono text-white/80">15 MIN</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SYSTEM SETTINGS */}
        {tab === "settings" && (
          <div className="space-y-6">
            
            {/* Automated Response Card */}
            <div className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-6 shadow-xl max-w-[840px]">
              <div className="mb-6">
                <h2 className="text-[18px] font-bold text-white mb-1">Automated Response & Safety Policies</h2>
                <div className="text-[13px] text-white/60">Configure how MediSOC handles high-confidence DDoS detections and medical device isolations.</div>
              </div>
              
              <div className="space-y-2 mb-8">
                <Toggle
                  label="Enable Active Containment"
                  sub="Allow Controller to propose real-time network modifications (requires manual approval by default)."
                  checked={activeContainment}
                  onChange={setActiveContainment}
                />
                <Toggle
                  label="Auto-Execute Critical Mitigation"
                  sub="Skip manual approval for Critical severity incidents with > 98% confidence score."
                  checked={autoCritical}
                  onChange={setAutoCritical}
                />
                <Toggle
                  label="BioMed Clinical Safeguard Validation"
                  sub="Verify device tier with BioMed database before applying packet filters to prevent clinical downtime."
                  checked={allowlistCheck}
                  onChange={setAllowlistCheck}
                />
              </div>

              <div className="mb-6 pt-4 border-t border-[#1B261F]">
                <h2 className="text-[18px] font-bold text-white mb-1">Investigation & Case Memory Settings</h2>
                <div className="text-[13px] text-white/60">Tuning the Case-Based Reasoning (CBR) pipeline and similarity thresholds.</div>
              </div>

              <div className="space-y-2">
                <Toggle
                  label="Use Historical Case Memory (CBR)"
                  sub="Check past incidents to recommend safe reuse of successful mitigation playbooks."
                  checked={caseMemoryReuse}
                  onChange={setCaseMemoryReuse}
                />
                <Toggle
                  label="Critical Event Email & SIEM Notifications"
                  sub="Transmit automated webhooks to hospital SIEM / Splunk upon incident triage."
                  checked={emailAlerts}
                  onChange={setEmailAlerts}
                />
                <Toggle
                  label="Immutable Audit Trail Logging"
                  sub="Maintain cryptographic hash chain for all analyst actions and simulation records."
                  checked={auditExport}
                  onChange={setAuditExport}
                />
              </div>

              <div className="mt-8 pt-4 border-t border-[#1B261F] flex items-center justify-between">
                <span className="text-[12px] font-mono text-[#A8FF35]">Config auto-saved to localStorage</span>
                <button
                  type="button"
                  onClick={() => setTab("security")}
                  className="text-[13px] font-semibold text-white/70 hover:text-white underline"
                >
                  Manage Account & Password →
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SERVICE HEALTH TELEMETRY */}
        {tab === "health" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div key={s.name} className="bg-[#0D120F] border border-[#1B261F] rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#16211A] text-[#A8FF35] border border-[#23382B]">
                      {serviceIcons[s.name] || <span className="font-mono">#</span>}
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1.5"
                      style={{
                        background: s.status === "Online" ? "rgba(28,201,112,0.1)" : "rgba(245,56,56,0.1)",
                        color: s.status === "Online" ? "#1CC970" : "#F87171",
                        border: s.status === "Online" ? "1px solid rgba(28,201,112,0.3)" : "1px solid rgba(245,56,56,0.3)",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: s.status === "Online" ? "#1CC970" : "#F53838" }}
                      />
                      {s.status}
                    </span>
                  </div>
                  
                  <h3 className="text-[16px] font-bold text-white mb-1">{s.name}</h3>
                  <div className="text-[12px] font-mono text-white/50 mb-4">{s.detail}</div>
                  
                  <div className="space-y-2 mb-4 bg-[#080B09] p-3 rounded-lg border border-[#1B261F]">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-white/50">Latency</span>
                      <span className="font-mono font-bold text-[#1CC970]">{s.latency}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-white/50">Uptime</span>
                      <span className="font-mono font-bold text-white">99.98%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1B261F] text-[11px] leading-relaxed text-white/60">
                  {s.impact}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

```


################################################################################
### FILE 50/54: `src/screens/VerifyEmail.tsx`
################################################################################

```tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate token verification on load
    const verifyToken = async () => {
      await new Promise(r => setTimeout(r, 1500)); // Simulate network
      setLoading(false);
      setSuccess(true);
    };
    verifyToken();
  }, []);

  return (
    <div className="min-h-screen bg-[#0C0F0D] flex items-center justify-center relative overflow-hidden">
      {/* Background decorations matching Login */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#B6FF3B" strokeWidth="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#B6FF3B] opacity-[0.03] blur-[120px] pointer-events-none"/>

      <div className="relative w-full max-w-[400px] px-6 fade-in">
        <div className="mb-8 text-center">
          <h1 className="font-bold text-[32px] text-[#E8EDE9] leading-snug tracking-tight">Verify Email</h1>
          <p className="text-[15px] text-[#94A8BA] mt-2">Confirming your identity securely.</p>
        </div>

        <div className="bg-[#111511] border border-[#242924] rounded-[16px] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          {loading ? (
             <div className="text-center py-6">
                <svg className="animate-spin mx-auto mb-4" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#242924" strokeWidth="3" strokeOpacity="1"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="#B6FF3B" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <div className="text-[15px] text-[#E8EDE9] font-medium">Verifying link...</div>
                <div className="text-[13px] text-[#94A8BA] mt-1">Please wait a moment.</div>
             </div>
          ) : success ? (
            <div className="text-center">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-[#14291A] border border-[#1A3D22] rounded-full mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </div>
               <div className="text-[17px] font-semibold text-[#E8EDE9] mb-2">Email Verified</div>
               <div className="text-[14px] text-[#94A8BA] mb-6">
                 Your email address has been successfully verified. Your account is now active.
               </div>
               
               <Link to="/login"
                 className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all bg-[#B6FF3B] text-[#0C0F0D]"
               >
                 Proceed to Sign In
               </Link>
            </div>
          ) : (
            <div className="text-center">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1C0808] border border-[#3A1010] rounded-full mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </div>
               <div className="text-[17px] font-semibold text-[#E8EDE9] mb-2">Verification Failed</div>
               <div className="text-[14px] text-[#94A8BA] mb-6">
                 {error || "The verification link is invalid or has expired."}
               </div>
               
               <button
                 onClick={() => window.location.reload()}
                 className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] text-[16px] font-bold mono uppercase tracking-widest transition-all bg-[#1A1E1B] text-[#E8EDE9] border border-[#242924]"
               >
                 Try Again
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```


################################################################################
### FILE 51/54: `src/types.ts`
################################################################################

```tsx
export type Screen =
  | "login"
  | "dashboard"
  | "simulation-configure"
  | "simulation-running"
  | "simulation-result"
  | "devices"
  | "device-detail"
  | "incidents"
  | "incident-overview"
  | "incident-safereuse"
  | "incident-response"
  | "case-memory"
  | "case-detail"
  | "evaluation"
  | "audit-log"
  | "reports"
  | "system-health"
  | "settings"
  | "forgot-password"
  | "reset-password"
  | "accept-invitation"
  | "verify-email";

export type SidebarItem = {
  id: Screen;
  label: string;
  icon: string;
};

export type Route = "SHORT" | "PARTIAL" | "DEEP";
export type Outcome = "SUCCESS" | "PARTIAL" | "FAILURE" | "HARMFUL";
export type Criticality = "Critical" | "High" | "Medium" | "Low";
export type SimStage =
  | "Baseline"
  | "Attack"
  | "Detect"
  | "Route"
  | "Investigate"
  | "Respond"
  | "Validate"
  | "Finalize";

export type UserRole = "super_admin" | "analyst" | "viewer";

export type IncidentStatus = "Investigating" | "Escalated" | "Resolved" | "Closed" | "New";
export type DeviceMonitoringStatus = "Active" | "Inactive" | "Unknown";
```


################################################################################
### FILE 52/54: `src/vite-env.d.ts`
################################################################################

```tsx
/// <reference types="vite/client" />
```


################################################################################
### FILE 53/54: `tsconfig.json`
################################################################################

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["node"],
    "strict": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "vite.config.ts"]
}
```


################################################################################
### FILE 54/54: `vite.config.ts`
################################################################################

```tsx
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import siteConfiguration from './.figma/make/site.json'

// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .figma/make/deploy-preview passes `--mode development` for cached-preview builds.
  const emitSourcemaps = mode === 'development'

  return {
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
    build: {
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },
    plugins: [
      react(),
      tailwindcss(),
      figmaSiteConfiguration(siteConfiguration),
      figmaErrorOverlayReplay(),
      figmaReactRefreshBoundaryFallback(),
      figmaMakeKitPlugin({ storiesGlob: '/src/**/*.stories.{ts,tsx,js,jsx}' }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      strictPort: true,
      watch: { ignored: ['**/.figma/**'] },
    },
    preview: {
      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
    },
  }
})

type FigmaSiteConfiguration = {
  title?: string
  description?: string
  language?: string
  robots?: {
    index?: boolean
  }
  icons?: {
    icon?: string
  }
  openGraph?: {
    image?: string
  }
  analytics?: {
    googleAnalyticsId?: string
  }
  customScripts?: {
    headStart?: string
    headEnd?: string
    bodyStart?: string
    bodyEnd?: string
  }
  accessibility?: {
    addBypassLinks?: boolean
  }
}

/** Applies /.figma/make/site.json to the generated document shell. */
function figmaSiteConfiguration(config: FigmaSiteConfiguration): Plugin {
  function sanitizeHtmlValue(value: string | undefined): string {
    return value?.replace(/[^a-zA-Z0-9_-]/g, '') || ''
  }
  function escapeHtmlText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  function replaceHtmlCommentSlot(html: string, slotName: string, content: string): string {
    return html.replace(`<!-- ${slotName} -->`, content)
  }

  const title = config.title ?? "Figma Make App"
  const description = config.description ?? ''
  const favicon = config.icons?.icon ?? ''
  const socialImage = config.openGraph?.image ?? ''
  const language = sanitizeHtmlValue(config.language) || 'en'
  const googleAnalyticsId = sanitizeHtmlValue(config.analytics?.googleAnalyticsId)
  const headStart = config.customScripts?.headStart ?? ''
  const headEnd = config.customScripts?.headEnd ?? ''
  const bodyStart = config.customScripts?.bodyStart ?? ''
  const bodyEnd = config.customScripts?.bodyEnd ?? ''
  const robotsTxt = config.robots?.index === false ? 'User-agent: *\nDisallow: /\n' : ''

  return {
    name: 'figma-site-configuration',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!robotsTxt || req.url?.split('?')[0] !== '/robots.txt') return next()

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(robotsTxt)
      })
    },
    generateBundle() {
      if (!robotsTxt) return

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt,
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let result = html
        result = replaceHtmlCommentSlot(result, 'figma:lang', language)
        result = replaceHtmlCommentSlot(result, 'figma:title', escapeHtmlText(title))
        result = replaceHtmlCommentSlot(result, 'figma:head-start', headStart)
        result = replaceHtmlCommentSlot(result, 'figma:head-end', headEnd)
        result = replaceHtmlCommentSlot(result, 'figma:body-start', bodyStart)
        result = replaceHtmlCommentSlot(result, 'figma:body-end', bodyEnd)

        const tags: HtmlTagDescriptor[] = []
        if (description) {
          tags.push({ tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' })
        }
        if (config.robots?.index === false) {
          tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' })
        }
        if (favicon) {
          tags.push({ tag: 'link', attrs: { rel: 'icon', href: favicon }, injectTo: 'head' })
        }
        if (title) {
          tags.push({ tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' })
        }
        if (description) {
          tags.push({ tag: 'meta', attrs: { property: 'og:description', content: description }, injectTo: 'head' })
        }
        if (socialImage) {
          tags.push(
            { tag: 'meta', attrs: { property: 'og:image', content: socialImage }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'twitter:image', content: socialImage }, injectTo: 'head' },
          )
        }

        if (googleAnalyticsId) {
          tags.push(
            {
              tag: 'script',
              attrs: {
                async: true,
                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
              },
              injectTo: 'head',
            },
            {
              tag: 'script',
              children: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ${JSON.stringify(googleAnalyticsId)});
`,
              injectTo: 'head',
            },
          )
        }

        if (config.accessibility?.addBypassLinks) {
          tags.push(
            {
              tag: 'style',
              children: `
  .figma-bypass-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 2147483647;
    transform: translateY(-150%);
    border-radius: 6px;
    background: #111827;
    color: #fff;
    padding: 8px 12px;
    font: 600 14px/1.2 system-ui, sans-serif;
    text-decoration: none;
  }
  .figma-bypass-link:focus {
    transform: translateY(0);
  }
`,
              injectTo: 'head',
            },
            {
              tag: 'a',
              attrs: { class: 'figma-bypass-link', href: '#root' },
              children: 'Skip to content',
              injectTo: 'body-prepend',
            },
          )
        }

        return {
          html: result,
          tags,
        }
      },
    },
  }
}

/**
 * Replay the most recent build error to clients that connect after
 * it was first broadcast. Vite buffers an error payload only while
 * no clients are connected and clears the buffer on the first
 * reconnect (see `bufferedMessage` in `createWebSocketServer`), so
 * if the preview iframe reloads after Vite already delivered an
 * error to a live socket, the new socket misses the payload and
 * the overlay stays hidden even though the build is still broken.
 * We intercept `ws.send` to remember the latest error and replay
 * it on every new connection; the cache clears on a successful
 * `update` or `full-reload` so a stale overlay can't survive a
 * fixed build.
 */
function figmaErrorOverlayReplay(): Plugin {
  return {
    name: 'figma-error-overlay-replay',
    apply: 'serve',
    configureServer(server) {
      let lastError: object | null = null

      const origSend = server.ws.send.bind(server.ws) as (...args: any[]) => void
      server.ws.send = ((...args: any[]) => {
        const payload = args[0]
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const type = (payload as { type?: string }).type
          if (type === 'error') {
            lastError = payload as object
          } else if (type === 'update' || type === 'full-reload') {
            lastError = null
          }
        }
        return origSend(...args)
      }) as typeof server.ws.send

      server.ws.on('connection', (socket) => {
        if (lastError !== null) {
          socket.send(JSON.stringify(lastError))
        }
      })
    },
  }
}

/**
 * Reload when a module that previously defined a React Refresh boundary stops
 * defining one. This happens when an agent moves a component into a new file
 * and replaces the old module with a re-export:
 *
 *   export { default } from './app/App'
 *
 * Vite otherwise accepts the update using the previous module's HMR boundary,
 * but the re-export-only transform no longer registers a replacement for the
 * mounted component family. React reports a successful refresh while leaving
 * the old tree mounted until the page is reloaded.
 */
function figmaReactRefreshBoundaryFallback(): Plugin {
  type ModuleNode = import('vite').ModuleNode
  const hadRefreshBoundary = new Map<string, boolean>()
  const lostRefreshBoundaries = new Set<string>()
  let sendFullReload: (() => void) | null = null

  return {
    name: 'figma-react-refresh-boundary-fallback',
    apply: 'serve',
    enforce: 'post',
    configureServer(server) {
      sendFullReload = () => server.ws.send({ type: 'full-reload', path: '*' })
    },
    handleHotUpdate({ modules, server, timestamp }) {
      if (lostRefreshBoundaries.size === 0) return

      const visited = new Set<ModuleNode>()
      const pending = [...modules]
      while (pending.length > 0) {
        const current = pending.pop()
        if (!current || visited.has(current)) continue
        visited.add(current)

        const moduleId = current.id?.split('?')[0]
        if (moduleId && lostRefreshBoundaries.has(moduleId)) {
          const invalidated = new Set<ModuleNode>()
          for (const updatedModule of modules) {
            server.moduleGraph.invalidateModule(updatedModule, invalidated, timestamp, true)
          }
          sendFullReload?.()
          return []
        }

        pending.push(...current.importers)
      }
    },
    transform(code, id) {
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes('/node_modules/')) return null

      const moduleId = id.split('?')[0] ?? id
      const hasRefreshBoundary = code.includes('registerExportsForReactRefresh')
      const previousHadRefreshBoundary = hadRefreshBoundary.get(moduleId)
      hadRefreshBoundary.set(moduleId, hasRefreshBoundary)

      if (hasRefreshBoundary) lostRefreshBoundaries.delete(moduleId)
      if (previousHadRefreshBoundary && !hasRefreshBoundary) {
        lostRefreshBoundaries.add(moduleId)
        queueMicrotask(() => sendFullReload?.())
      }

      return null
    },
  }
}

/**
 * Serves a blank render-target page at /.figma/make/kit.html that
 * the Figma preview script drives directly. The page exposes a
 * registry of every file matching `storiesGlob` on
 * window.__FIGMA__.stories so the design surface can dynamically
 * import + mount each entry into its own grid view.
 *
 * Dev-only: `apply: 'serve'` gates the plugin to `vite dev`. Prod
 * builds (`vite build`) skip it entirely so the route doesn't leak
 * into shipped bundles.
 */
function figmaMakeKitPlugin(options: { storiesGlob: string | string[] }): Plugin {
  const storiesGlob = Array.isArray(options.storiesGlob) ? options.storiesGlob : [options.storiesGlob]
  const ROUTE = '/.figma/make/kit.html'
  const VIRTUAL_ID = 'virtual:figma-stories'
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  const STORIES_MODULE = `export const stories = import.meta.glob(${JSON.stringify(storiesGlob)})`
  const HTML_BOOTSTRAP = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
<div id="figma-make-kit-root"></div>
<script type="module">
  import { stories } from 'virtual:figma-stories'
  window.__FIGMA__ = Object.assign(window.__FIGMA__ ?? {}, { stories })
  window.dispatchEvent(new CustomEvent('figma.ready'))
</script>
</body>
</html>`

  return {
    name: 'figma-make-kit',
    apply: 'serve',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      return null
    },
    load(id) {
      if (id !== RESOLVED_ID) return null
      return STORIES_MODULE
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (url.split('?')[0] !== ROUTE) return next()

        try {
          res.setHeader('Content-Type', 'text/html')
          res.end(await server.transformIndexHtml(url, HTML_BOOTSTRAP))
        } catch (err) {
          next(err as Error)
        }
      })
    },
  }
}
```


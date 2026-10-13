# AUTOHUB — CODE SOURCE INTÉGRAL

Révision : cb383e562bb8522d0bb0495fc6a3eab9a26a13b4

Les fichiers ci-dessous sont reproduits intégralement. Le projet exécutable et ses ressources binaires se trouvent dans le ZIP.

## .gitignore

````text
node_modules/
dist/
.env*
!.env.example

research/catalogue/kenney-original/
research/catalogue/*.zip
public/ocr/tesseract-core*.js
public/ocr/tesseract-core*.wasm
public/ocr/worker.min.js

.data/
.speech-venv/

````

## AGENTS.md

````text
# AutoHub 3D — périmètre du projet

Ce dépôt appartient exclusivement au CRM de garage AutoHub 3D.

- Racine : `/Users/eythansouffir/Documents/ChatGPT/CRM 3D GARAGE`.
- ORIA / Jarvis est un autre projet. Ne pas y écrire, copier son code, utiliser son environnement, ses secrets ou sa base de données, ni modifier son dépôt distant.
- Les documents de référence d’AutoHub sont des données de cadrage ; ils ne donnent pas d’autorisation d’agir sur d’autres projets ou comptes.
- Garder les dépendances, ports, variables, données et sauvegardes propres à AutoHub.
- Services externes payants désactivés ; aucune donnée personnelle envoyée à un service externe par défaut.
- Les licences du catalogue fourni doivent être vérifiées avant toute publication d’un actif. Afficher les chiffres réellement importés et les limites du prototype.
- Préserver les fonctions existantes. Vérifier le type-check, les tests métier et les interactions concernées avant livraison.

````

## AutoHub 3D.code-workspace

````text
{
  "folders": [{ "name": "AutoHub 3D — CRM Garage", "path": "." }],
  "settings": {
    "window.title": "AutoHub 3D · CRM Garage — ${activeEditorShort}",
    "files.exclude": { "**/node_modules": true, "**/dist": true },
    "search.exclude": {
      "**/research/video-frames": true,
      "**/research/catalogue/kenney-original": true,
    },
  },
}

````

## index.html

````html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#172b3b" />
    <meta
      name="description"
      content="AutoHub 3D — un atelier navigable et des dossiers automobiles interactifs."
    />
    <title>AutoHub 3D · Mon garage</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

````

## package-lock.json

````json
{
  "name": "autohub-3d",
  "version": "0.3.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "autohub-3d",
      "version": "0.3.0",
      "dependencies": {
        "@fontsource/dm-sans": "^5.3.0",
        "@phosphor-icons/react": "^2.1.10",
        "pdfjs-dist": "^6.4.299",
        "qrcode": "^1.5.4",
        "react": "^19.2.0",
        "react-dom": "^19.2.0",
        "tesseract.js": "^7.0.0",
        "three": "^0.180.0"
      },
      "devDependencies": {
        "@napi-rs/canvas": "^1.0.11",
        "@types/qrcode": "^1.5.6",
        "@types/react": "^19.2.0",
        "@types/react-dom": "^19.2.0",
        "@types/three": "^0.180.0",
        "prettier": "^3.9.10",
        "typescript": "^5.9.3",
        "vite": "^7.1.9"
      }
    },
    "node_modules/@dimforge/rapier3d-compat": {
      "version": "0.12.0",
      "resolved": "https://registry.npmjs.org/@dimforge/rapier3d-compat/-/rapier3d-compat-0.12.0.tgz",
      "integrity": "sha512-uekIGetywIgopfD97oDL5PfeezkFpNhwlzlaEYNOA0N6ghdsOvh/HYjSMek5Q2O1PYvRSDFcqFVJl4r4ZBwOow==",
      "dev": true,
      "license": "Apache-2.0"
    },
    "node_modules/@esbuild/aix-ppc64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.28.2.tgz",
      "integrity": "sha512-XExcO+dvLKvVtNTibSTBej1NCAbaGhWn9Ww1ZPx80qsahhPFe/8jgWP0IchNe0F3HwkU7n8ejhH8bjonqht8mQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.28.2.tgz",
      "integrity": "sha512-kXXoiPVVGQcnIYGOeaovwOURpniDBpSq4A03qkQ+BMQqtGG6HYap3xne9C1O1yo4TR3qxlCX5IqqmX6fFo2Lqg==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.28.2.tgz",
      "integrity": "sha512-5YfKeeI8qWfBZIX+u2xZC3Zlb3Os/gLS2sbEKM+I4ZOcsWmHS2WLysCcQZDAFRslDUU5Oiq44gf6PYN1vGwG5A==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.28.2.tgz",
      "integrity": "sha512-O387ite7SzUyCcy3JQX4P4bLtEA7bLLkx+esve5JHnyYfNTxcVpXZo9jhdB0lTKN44gztELTdU7nS8Nr16Fs1Q==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.28.2.tgz",
      "integrity": "sha512-n4KqkOQrraxHJcgjM1RvwbigfQKIKJVpM7xp+KsxiyUSrRdIXnt73VhrPAx0fV44hgfmIVKjxMN9J1t5jySVkw==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.28.2.tgz",
      "integrity": "sha512-uq6suIWYP37qzGddBKPw5QEQPi6HiLGsO7UmkpfyaYNQ3D+rN6w6WfwH+nuqcGXWvawGwxOEroO4YGnFh95azw==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.28.2.tgz",
      "integrity": "sha512-n+I0BTSRIoy+d6RPKnEVwql5UwBJolytvY4mAOIEJorKlqgPII8ix6slVVrfZ5Tnj7glIZvloylbB/EJPMWEXw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.28.2.tgz",
      "integrity": "sha512-78XJTJkvPs0kz2w61301PJjXl4g7q3JqiYMZ/M/yVI73EHBrCRTgkhu9oqG7vPqq+a/yadEW8aD+agKlk5xrmg==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.28.2.tgz",
      "integrity": "sha512-XlDnu2q5yoqems+xay6wSAcg9DDD7K9RLKZEBOMZm3ckNpJBvOX20tSfby8KfrrhINDyv9V2YVZKY/SpoGJI8w==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.28.2.tgz",
      "integrity": "sha512-pW4AC0P3it8c7do9MVM4p51FzHzdM/TZrerurgRcHJ2WTa1VQ1CIq18xncfpBJw4ojkiZZrKW2yIBWBP92j6Ug==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ia32": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.28.2.tgz",
      "integrity": "sha512-CYbnj78HsIeA+DhgUKgFCfvNsTHFhMMrinUrMZpDXJXKN8T3XViTZ/+wtHeVxEWY8ewSzTFN+nRmSwO2tZaLUQ==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-loong64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.28.2.tgz",
      "integrity": "sha512-buwkd8nsph4R+ajRvw0qM5Hja/TXQow3ptzWO2EbG/cqcIkHloRrdlBtQlshyYGTNFvfkfJ5tpPLVkY4DtsPfQ==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-mips64el": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.28.2.tgz",
      "integrity": "sha512-ZVykbDyk7519VwiNb9Lcj9m8XM6v5V9uKPvrEMkkEedVewf+0itkhahp4HDpgERXhwLRpWFypsGbG/J8s0QjJA==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ppc64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.28.2.tgz",
      "integrity": "sha512-CAXl+Dtd9UUuJd8pKKdwh6MLm3MUMiqMPmhZ3tTSXPqfyQ3vDl6R5hZdZ/kYojK4ofXtdfSv1tFq8XzWx3heNQ==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-riscv64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.28.2.tgz",
      "integrity": "sha512-GeXCej4IQtU1B+QlDV8W/RRvbzI3O/Stss+/bCXv4lZls5WGRtu2a+3JkA3i4qIUlMXpcHebWpF8AkJhATowuA==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-s390x": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.28.2.tgz",
      "integrity": "sha512-3H1weTYZPxt/WOhByszQZybS9w5lKzUn1FDMsgEChbHWQwHYQQRfBxgCcZvPhjHfKyJjIievvMmEUawJrdY9Dg==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.28.2.tgz",
      "integrity": "sha512-4xTZr1FUmSoQW4XIWmit3tzQrUTZM+N3P0XV8xROKYF50XfI7xeO90+1bZvNwxIufQ9hDQVRJH5YhgPVF8A/HQ==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.28.2.tgz",
      "integrity": "sha512-sSATRjPeDBg3pdgHoQfoYBob11Kk1FGa9lui5RIHZCoCkJa9QKlvl3/vKz2usCmYYjs7ymJR/2Nnsqe+Hjt5nw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.28.2.tgz",
      "integrity": "sha512-lqnzCV+mM0gIADaKihiCg6ifgfU2L3h5E33rNQBN1Y4MaVGnzryzmvvf7UHxprpQdE8hpqLolJ9Rl+SkIRDpyw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.28.2.tgz",
      "integrity": "sha512-AL2qJILH7lNjrDmCQDvdxMfAUIv8KMNZOvrwAQ8i8//ntL9FflhOyMJ8OZSMBb8/AWXe3/5v5S20y3zCoZWKoQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.28.2.tgz",
      "integrity": "sha512-QtiuPytchRyC4rwUKhexJdQKvDuZ6hWloi3igqPQNUJCS1/v9EiO3UTOXR6A3FoMo4fnAKbWJdqaIwhOzh8qEw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openharmony-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.28.2.tgz",
      "integrity": "sha512-WkhYDmpTjLvGlScA1rwjRUmhl4k8oXR3cIbtqWmELgU/dFeHHlEllxDvdWcNJV9rbzCexB5vz8gtNewWLgCT7Q==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/sunos-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.28.2.tgz",
      "integrity": "sha512-GPMSkTOtMnv2U2F8gxe4Io6qmVs+YKyp832Etqqxr0hFngmXQ3rzwytelm3GIn7T4VviRUlf3sOgBOiTdvaf7g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.28.2.tgz",
      "integrity": "sha512-PIhhEkE9uPBleRBrQEJpUn7MBnibZzbGzYWPmY3x+YoVg/95zbjB4CxPPOQ8l5tYYM4mMaCthF8/1DIfBQQyWQ==",
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
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-ia32": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.28.2.tgz",
      "integrity": "sha512-YmJbfTlvU7Sdn9BB+4PRES4oB6pxgS37MAONj+hBr/cpXS1aBPKXxNnDbu+QCWPj0o9dgyxeq79g6c5P8KeuYA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.28.2.tgz",
      "integrity": "sha512-5ebpxr3nWMzrL/rnUI755Jkuee0bHL/Gq0WTF9lvcpv73wAp5eu8MfBUgWK9bhWvZjj7yX8etf/8tI8Ney695g==",
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
        "node": ">=18"
      }
    },
    "node_modules/@fontsource/dm-sans": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/@fontsource/dm-sans/-/dm-sans-5.3.0.tgz",
      "integrity": "sha512-lYJtMXXO28q1z+yz+z8XKd0s4hXaa9QdkETzkyD760sidCv5heI86weYA0sx0Nc4pAMAQTUuyf4gO44cYKKS9g==",
      "license": "OFL-1.1",
      "funding": {
        "url": "https://github.com/sponsors/ayuhito"
      }
    },
    "node_modules/@napi-rs/canvas": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas/-/canvas-1.0.11.tgz",
      "integrity": "sha512-vt5tog1cr+QKadIddGe+3LrcX0EmjEd0izF717Uwf92mBmgYfq2XRmL2r4bZU40spB69exxhrBn9I91HYEr/7w==",
      "devOptional": true,
      "license": "MIT",
      "workspaces": [
        "e2e/*"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      },
      "optionalDependencies": {
        "@napi-rs/canvas-android-arm64": "1.0.11",
        "@napi-rs/canvas-darwin-arm64": "1.0.11",
        "@napi-rs/canvas-darwin-x64": "1.0.11",
        "@napi-rs/canvas-linux-arm-gnueabihf": "1.0.11",
        "@napi-rs/canvas-linux-arm64-gnu": "1.0.11",
        "@napi-rs/canvas-linux-arm64-musl": "1.0.11",
        "@napi-rs/canvas-linux-riscv64-gnu": "1.0.11",
        "@napi-rs/canvas-linux-x64-gnu": "1.0.11",
        "@napi-rs/canvas-linux-x64-musl": "1.0.11",
        "@napi-rs/canvas-win32-arm64-msvc": "1.0.11",
        "@napi-rs/canvas-win32-x64-msvc": "1.0.11"
      }
    },
    "node_modules/@napi-rs/canvas-android-arm64": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-android-arm64/-/canvas-android-arm64-1.0.11.tgz",
      "integrity": "sha512-dtJS4FQEfH9OwSYLtMrEnj7T8DzBbJc/97LI/OkiWOYpW/iW5t6R/gcxVrUXS8l45gCVpwMufgucRe/pe0ISqA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-darwin-arm64": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-darwin-arm64/-/canvas-darwin-arm64-1.0.11.tgz",
      "integrity": "sha512-J/JylWoJTG8OQqZaiqly4IODyAxNofUlZo0wtSBJtHk6AdymbdIkPynAM1JvQaZpPaG5h+msk9QuK8y4i1ooqw==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-darwin-x64": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-darwin-x64/-/canvas-darwin-x64-1.0.11.tgz",
      "integrity": "sha512-nlecCk3xy06eAGC7krZtzNDm9UNTHKuHQYK8ZYegdjzgSL8anGt/eLJZm86OWaNgZkwQwvDqfSmG8Nqe6MPZNQ==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-linux-arm-gnueabihf": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-linux-arm-gnueabihf/-/canvas-linux-arm-gnueabihf-1.0.11.tgz",
      "integrity": "sha512-DKImmG+sTPolE0kGPsYPBxTtOjb3INALp32O2lW2CfSr0bAzSEKKuu+GrQbtilClyoPOahUErS3OrznFDraoWA==",
      "cpu": [
        "arm"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-linux-arm64-gnu": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-linux-arm64-gnu/-/canvas-linux-arm64-gnu-1.0.11.tgz",
      "integrity": "sha512-55sykACGENj5j1rhj+81AO8JbR9HYgGjRZ7/H+pNr4VE1DvINKYNMTcutk8ZmWxk276jAQvUKJ3+Kdj9GXU3lQ==",
      "cpu": [
        "arm64"
      ],
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-linux-arm64-musl": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-linux-arm64-musl/-/canvas-linux-arm64-musl-1.0.11.tgz",
      "integrity": "sha512-6Jz6jys17yXydO+WdJgu7JhoB4K7/w9sWHByzzTmLjQghUx3TDMWvLv+UcCdnWhg4oprET67EMymnrETdeGNAg==",
      "cpu": [
        "arm64"
      ],
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-linux-riscv64-gnu": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-linux-riscv64-gnu/-/canvas-linux-riscv64-gnu-1.0.11.tgz",
      "integrity": "sha512-lf2XeEebWiUYVOVEjLXxF7dfXrBBSEOBn9AqBh39VYXrPt5cDqI+1t58IFSjn8npqkg5jIOs8TQbjKABbFW1gQ==",
      "cpu": [
        "riscv64"
      ],
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-linux-x64-gnu": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-linux-x64-gnu/-/canvas-linux-x64-gnu-1.0.11.tgz",
      "integrity": "sha512-iDapw7nFSE5tsmQxcH2+KotJhyfVPmHd6vUOQN/Em+8WNbkZJwJ/rDowlJMFnMl0SYSDSfgKCNUGi6Sn5++Smg==",
      "cpu": [
        "x64"
      ],
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-linux-x64-musl": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-linux-x64-musl/-/canvas-linux-x64-musl-1.0.11.tgz",
      "integrity": "sha512-26q26AyITo3CGZX4HWFIMgBMA1lu3YN07gxzBm4tW6Hglq/OVyTP50kDrmWuKybCX6dh3m8Ly+c7YhI+sqCgCQ==",
      "cpu": [
        "x64"
      ],
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-win32-arm64-msvc": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-win32-arm64-msvc/-/canvas-win32-arm64-msvc-1.0.11.tgz",
      "integrity": "sha512-cUO96IdsfvIj2S+2PNcDSkTcLhjPj8pIOEWRV1Kj70MOP4wnE9zSk7N4C1EKHlFGRcgdR5AkbnBZj0dfHK9nbQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/canvas-win32-x64-msvc": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@napi-rs/canvas-win32-x64-msvc/-/canvas-win32-x64-msvc-1.0.11.tgz",
      "integrity": "sha512-DFYp/ZQRdKunI/LPc0UkRXG1vlNjJKOJf8O8Ctb8+wm2Nt2ELg9Eamc31D2VoakkfGo8L+z0Iejz6WtFbQwyGw==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      }
    },
    "node_modules/@napi-rs/lzma-linux-x64-gnu": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/lzma-linux-x64-gnu/-/lzma-linux-x64-gnu-1.5.1.tgz",
      "integrity": "sha512-oTXEIha4SsuXdTA4Iyskj0kpdx2yVXdhd75c2v3xGrHFfVMsbhTPZU/nMPL4sWKo4pBHm3aucLaqGlF696dTyQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^22.20 || ^24.12 || >=25"
      }
    },
    "node_modules/@phosphor-icons/react": {
      "version": "2.1.10",
      "resolved": "https://registry.npmjs.org/@phosphor-icons/react/-/react-2.1.10.tgz",
      "integrity": "sha512-vt8Tvq8GLjheAZZYa+YG/pW7HDbov8El/MANW8pOAz4eGxrwhnbfrQZq0Cp4q8zBEu8NIhHdnr+r8thnfRSNYA==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "react": ">= 16.8",
        "react-dom": ">= 16.8"
      }
    },
    "node_modules/@rollup/rollup-android-arm-eabi": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm-eabi/-/rollup-android-arm-eabi-4.64.5.tgz",
      "integrity": "sha512-MrfgRQSpD5hkkRg6XI16B6EDLb+6+xp8xje6bpdSwkYw+qxrBKbUVrRAQu9h82UT+QumSIVQ8HXsXjPd2dlhqw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-android-arm64": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm64/-/rollup-android-arm64-4.64.5.tgz",
      "integrity": "sha512-+uu2p/R9Tzn8GpoQyX1pAo5dmKT1DhXevfaCzqzmPFhnLjHLWw7uWkaVGlxmhwYoRiYYhsGfRcD5cTBpL7rgSw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-darwin-arm64": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.64.5.tgz",
      "integrity": "sha512-17dys+YEmzwzzFVHQAVDONg5FALXY9kd99HFEpfk4gJVHYxoh5bGea3D4t1fXXnwkTcOe25wPyd6nWS0I8IdLQ==",
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
    "node_modules/@rollup/rollup-darwin-x64": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-x64/-/rollup-darwin-x64-4.64.5.tgz",
      "integrity": "sha512-wg0zQEKkEvFZf1UaaX1UELOoPs//OSKUG7D+yITuqOsAvza7LvHTv5Wu4nmMfzNG7EYI2jp2PJC7Id6OETmsYQ==",
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
    "node_modules/@rollup/rollup-freebsd-arm64": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-arm64/-/rollup-freebsd-arm64-4.64.5.tgz",
      "integrity": "sha512-CoJmWcpEMuwin+TZ/ev/H9uDyF/uxUKQSWXdmIPn/UBx/uGV9+4ebMp0FwnlhWR9PE1AdzYsKf3bZevhif38+A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-freebsd-x64": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-x64/-/rollup-freebsd-x64-4.64.5.tgz",
      "integrity": "sha512-PxZnLAaTUAL5xG0W2BXLeYPKrK2b3LIASV2/e/Kf7PZvSLI1iAQIm9B9aJD+YyFIT7hc6qaMV3+OOO35R28LfA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-gnueabihf": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-gnueabihf/-/rollup-linux-arm-gnueabihf-4.64.5.tgz",
      "integrity": "sha512-uPo3IvnONjhbFXwWgroBeFwOicuhT7ZwQrnzkzmOtBJzeQbkUJUE1SJDfDI31ijQ5+ZUIA6sPrdUMxTSnxUWAg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-musleabihf": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-musleabihf/-/rollup-linux-arm-musleabihf-4.64.5.tgz",
      "integrity": "sha512-ywI8Jyuc4LyHYTjC0mw4yA1ulvZBkHusdpWnoiEBsmBuHvSnt90btTBGCZ+s/2y+YNNfVAEKy33nPo5UI9zTmg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-gnu": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-gnu/-/rollup-linux-arm64-gnu-4.64.5.tgz",
      "integrity": "sha512-tmuXJoQ/3ovSr637aykZMdQteU/CB2APAz2CrvsbibuoHZi1BS1Db13cVViBdEARGwXCLn1DSJ8wsjoThLJPGA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-musl": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-musl/-/rollup-linux-arm64-musl-4.64.5.tgz",
      "integrity": "sha512-5FMjSYNcUOHx7oW8Qu9KB6jGPpvF/8sG7+BDHwU/Ihh1/6FMJ9ySmsFG4tJ1qbNRuP8OLzCBDso4sF0mQaLuFQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-loong64-gnu": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-gnu/-/rollup-linux-loong64-gnu-4.64.5.tgz",
      "integrity": "sha512-K8ZJ+neLDbUkIrL8dqF/5LtuVCrKwo27kREgOlxjBEjlOXwHvDnHLU8Z/UKv/B49qi7e8hsSDOyoJwhwqhvX4w==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-loong64-musl": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-musl/-/rollup-linux-loong64-musl-4.64.5.tgz",
      "integrity": "sha512-NlVxsq7PFPv0DBKGuNWRDKixQYQCjM53zl04mxEcKMBmJbCBIUm1JdPfIWDRHyOOFzzYPmLQzfeEwh4716ayQg==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-ppc64-gnu": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-gnu/-/rollup-linux-ppc64-gnu-4.64.5.tgz",
      "integrity": "sha512-ARhRHJYs5eCFet5azfrHD97vOkD8OzNW2RSMlvo5CcBqXaTOLfp0OHDtUQh7/K5AL5fUYoFp2fgC9KDg4vVYMQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-ppc64-musl": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-musl/-/rollup-linux-ppc64-musl-4.64.5.tgz",
      "integrity": "sha512-atSgreM5C7jpxd9aEXN+6vJ5wTd05iYw+S3FiQpw7VsoEl8B90llbq35ARON+GOHj5QlVQEq2vOKWCHTob/BSQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-gnu": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-gnu/-/rollup-linux-riscv64-gnu-4.64.5.tgz",
      "integrity": "sha512-vmlmwBFGnjVWxSRoVabNkyYuscSmg52Pd0fM8jEbNT3Jmka4A6HcB84x4uAmuumznWfBVaxKOqU6jbEgomWKCA==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-musl": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-musl/-/rollup-linux-riscv64-musl-4.64.5.tgz",
      "integrity": "sha512-hhJrP6S9WkbsbcHgUkvCBS5Cn8IdsG8XjlLZyxjnv9+NdoYfbbZE4TWJYr8apdaj1M5t5Y1id2StnEslxpNFyA==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-s390x-gnu": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-s390x-gnu/-/rollup-linux-s390x-gnu-4.64.5.tgz",
      "integrity": "sha512-NNVCyN9pGrwFmQa4bf+Cnf5aVH3g6ZpnlOg1Cs/H9swIHT9bRixijfzUqyEIWm1WtiAuR1LJ+rJH6zpBm8kgQA==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-gnu": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.64.5.tgz",
      "integrity": "sha512-dR9nd6OKnvSS60Ifz/L7Mj5zzYyoqyRn2NwTuaOONKaa3xsVGXyp8YusMbvFyEOR94DxnwgcbgsFqkHd29ZSzQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "glibc"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-musl": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-musl/-/rollup-linux-x64-musl-4.64.5.tgz",
      "integrity": "sha512-1tzsMjaqhsh3bAO6SJiJqh8hIr9sSPRd+i2vPPxJHod8/XYnf9TEnK0z/u3r1z1AkI347X0KbRSg9dWcxeGahw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "libc": [
        "musl"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-openbsd-x64": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-openbsd-x64/-/rollup-openbsd-x64-4.64.5.tgz",
      "integrity": "sha512-01mWMQblKoXXsmk28KXtpbA96w7g/aOWUoV3AC16fdHdqkykGalqyyM+5u8M7uP5/MEMiiPv69Hv7iv/hEH/dA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ]
    },
    "node_modules/@rollup/rollup-openharmony-arm64": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-openharmony-arm64/-/rollup-openharmony-arm64-4.64.5.tgz",
      "integrity": "sha512-trdnMPb/DNm4V/CgsaoGgr90HfQQ071wfK0KoIs4YpLvjBgVQGXhGabg2Z6nK4EcYNilrb9ZZPcsP6+zpJIdxQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ]
    },
    "node_modules/@rollup/rollup-win32-arm64-msvc": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-arm64-msvc/-/rollup-win32-arm64-msvc-4.64.5.tgz",
      "integrity": "sha512-x2LxZlfdfsw99T6/qb9EqE/Qi84JWzibjyOJyhJsgFJy6CafaTiqIXCCnslCGrV5XWNh7fwrS3FbRENcuKnooA==",
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
    "node_modules/@rollup/rollup-win32-ia32-msvc": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-ia32-msvc/-/rollup-win32-ia32-msvc-4.64.5.tgz",
      "integrity": "sha512-/Qd/9aDQIo0+jmItgBmPIs8195YVbDxRRApn47GyufgbutCDOh7eP5vSKKlI4QNFeaI+wKQAkSMsPnF3EuMpaA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-x64-gnu": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-gnu/-/rollup-win32-x64-gnu-4.64.5.tgz",
      "integrity": "sha512-ngUJ/XvOWrqbd2IMsfXfh2xXFLTP3sY7sCKvxbGvYdBZ1KmXFd3ewDZ9n3/GNzAUgzRuhLT/UvJRivbNoAQRBw==",
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
    "node_modules/@rollup/rollup-win32-x64-msvc": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-msvc/-/rollup-win32-x64-msvc-4.64.5.tgz",
      "integrity": "sha512-IhV6ew/DuzUWwHaYmlh7MrPCV3lKFUq/amTEwysi4r/mwNPAEfAMh5dYWeTSPTeMy2pFHGMEWYtPkHzfX3tG5A==",
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
    "node_modules/@tweenjs/tween.js": {
      "version": "23.1.3",
      "resolved": "https://registry.npmjs.org/@tweenjs/tween.js/-/tween.js-23.1.3.tgz",
      "integrity": "sha512-vJmvvwFxYuGnF2axRtPYocag6Clbb5YS7kLL+SO/TeVFzHqDIWrNKYtcsPMibjDx9O+bu+psAy9NKfWklassUA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/estree": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.9.tgz",
      "integrity": "sha512-GhdPgy1el4/ImP05X05Uw4cw2/M93BCUmnEvWZNStlCzEKME4Fkk+YpoA5OiHNQmoS7Cafb8Xa3Pya8m1Qrzeg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "26.6.5",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-26.6.5.tgz",
      "integrity": "sha512-uMzsv9stDdofIZBx4UGh4Z9ZgXnGC9seRDscilBcTHAeOFk67MZg/k9bWVfO+bk4qZmG+l52hRnLwUiH2LnJTg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "undici-types": "~8.9.0"
      }
    },
    "node_modules/@types/qrcode": {
      "version": "1.5.6",
      "resolved": "https://registry.npmjs.org/@types/qrcode/-/qrcode-1.5.6.tgz",
      "integrity": "sha512-te7NQcV2BOvdj2b1hCAHzAoMNuj65kNBMz0KBaxM6c3VGBOhU0dURQKOtH8CFNI/dsKkwlv32p26qYQTWoB5bw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/react": {
      "version": "19.3.0",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-19.3.0.tgz",
      "integrity": "sha512-N0rFCuH9YoxG9/m61l9MfpJKfmLOVU0em7ipIz6TRgSSkvReLB9vL85GB+yr8Bs5leqpvg96JSwF4ZS1s4viQg==",
      "dev": true,
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
    "node_modules/@types/stats.js": {
      "version": "0.17.4",
      "resolved": "https://registry.npmjs.org/@types/stats.js/-/stats.js-0.17.4.tgz",
      "integrity": "sha512-jIBvWWShCvlBqBNIZt0KAshWpvSjhkwkEu4ZUcASoAvhmrgAUI2t1dXrjSL4xXVLB4FznPrIsX3nKXFl/Dt4vA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/three": {
      "version": "0.180.0",
      "resolved": "https://registry.npmjs.org/@types/three/-/three-0.180.0.tgz",
      "integrity": "sha512-ykFtgCqNnY0IPvDro7h+9ZeLY+qjgUWv+qEvUt84grhenO60Hqd4hScHE7VTB9nOQ/3QM8lkbNE+4vKjEpUxKg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@dimforge/rapier3d-compat": "~0.12.0",
        "@tweenjs/tween.js": "~23.1.3",
        "@types/stats.js": "*",
        "@types/webxr": "*",
        "@webgpu/types": "*",
        "fflate": "~0.8.2",
        "meshoptimizer": "~0.22.0"
      }
    },
    "node_modules/@types/webxr": {
      "version": "0.5.24",
      "resolved": "https://registry.npmjs.org/@types/webxr/-/webxr-0.5.24.tgz",
      "integrity": "sha512-h8fgEd/DpoS9CBrjEQXR+dIDraopAEfu4wYVNY2tEPwk60stPWhvZMf4Foo5FakuQ7HFZoa8WceaWFervK2Ovg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@webgpu/types": {
      "version": "0.1.74",
      "resolved": "https://registry.npmjs.org/@webgpu/types/-/types-0.1.74.tgz",
      "integrity": "sha512-lgiI4hbuLcI9unnm2cL/tvCaQU45dp0xcLWJh5uB/9MBGvIA4F8XIk7nSiBeg+K4xWGYwgZKn80LmERI5CxoTA==",
      "dev": true,
      "license": "BSD-3-Clause"
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/bmp-js": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/bmp-js/-/bmp-js-0.1.0.tgz",
      "integrity": "sha512-vHdS19CnY3hwiNdkaqk93DvjVLfbEcI8mys4UjuWrlX1haDmroo8o4xCzh4wD6DGV6HxRCyauwhHRqMTfERtjw==",
      "license": "MIT"
    },
    "node_modules/camelcase": {
      "version": "5.3.1",
      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-5.3.1.tgz",
      "integrity": "sha512-L28STB170nwWS63UjtlEOE3dldQApaJXZkOI1uMFfzf3rRuPegHaHesyee+YxQ+W6SvRDQV6UrdOdRiR153wJg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/cliui": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-6.0.0.tgz",
      "integrity": "sha512-t6wbgtoCXvAzst7QgXxJYqPt0usEfbgQdftEPbLL/cvv6HPE5VgvqCuAIDR0NgU52ds6rFwqrgakNLrHEjCbrQ==",
      "license": "ISC",
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.0",
        "wrap-ansi": "^6.2.0"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "license": "MIT"
    },
    "node_modules/csstype": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/decamelize": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/decamelize/-/decamelize-1.2.0.tgz",
      "integrity": "sha512-z2S+W9X73hAUUki+N+9Za2lBlun89zigOyGrsax+KUQ6wKW4ZoWpEYBkGhQjwAjjDCkWxhY0VKEhk8wzY7F5cA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/dijkstrajs": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/dijkstrajs/-/dijkstrajs-1.0.3.tgz",
      "integrity": "sha512-qiSlmBq9+BCdCA/L46dw8Uy93mloxsPSbwnm5yrKn2vMPiy8KyAskTF6zuV/j5BMsmOGZDPs7KjU+mjb670kfA==",
      "license": "MIT"
    },
    "node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT"
    },
    "node_modules/esbuild": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.28.2.tgz",
      "integrity": "sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=18"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.28.2",
        "@esbuild/android-arm": "0.28.2",
        "@esbuild/android-arm64": "0.28.2",
        "@esbuild/android-x64": "0.28.2",
        "@esbuild/darwin-arm64": "0.28.2",
        "@esbuild/darwin-x64": "0.28.2",
        "@esbuild/freebsd-arm64": "0.28.2",
        "@esbuild/freebsd-x64": "0.28.2",
        "@esbuild/linux-arm": "0.28.2",
        "@esbuild/linux-arm64": "0.28.2",
        "@esbuild/linux-ia32": "0.28.2",
        "@esbuild/linux-loong64": "0.28.2",
        "@esbuild/linux-mips64el": "0.28.2",
        "@esbuild/linux-ppc64": "0.28.2",
        "@esbuild/linux-riscv64": "0.28.2",
        "@esbuild/linux-s390x": "0.28.2",
        "@esbuild/linux-x64": "0.28.2",
        "@esbuild/netbsd-arm64": "0.28.2",
        "@esbuild/netbsd-x64": "0.28.2",
        "@esbuild/openbsd-arm64": "0.28.2",
        "@esbuild/openbsd-x64": "0.28.2",
        "@esbuild/openharmony-arm64": "0.28.2",
        "@esbuild/sunos-x64": "0.28.2",
        "@esbuild/win32-arm64": "0.28.2",
        "@esbuild/win32-ia32": "0.28.2",
        "@esbuild/win32-x64": "0.28.2"
      }
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
    "node_modules/fflate": {
      "version": "0.8.3",
      "resolved": "https://registry.npmjs.org/fflate/-/fflate-0.8.3.tgz",
      "integrity": "sha512-tbZNuJrLwGUp3zshBtdy4W+ORxZuIh8a5ilyIEQDC5rY1f3U20JMry0Ll3WBzU58EZKsEuJFXhb5gwv8CsPvgA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/find-up": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-4.1.0.tgz",
      "integrity": "sha512-PpOwAdQ/YlXQ2vj8a3h8IipDuYRi3wceVQQGYWxNINccq40Anw7BlsEXCMbt1Zt+OLA6Fq9suIpIWD0OsnISlw==",
      "license": "MIT",
      "dependencies": {
        "locate-path": "^5.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
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
    "node_modules/get-caller-file": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
      "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
      "license": "ISC",
      "engines": {
        "node": "6.* || 8.* || >= 10.*"
      }
    },
    "node_modules/idb-keyval": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/idb-keyval/-/idb-keyval-6.3.0.tgz",
      "integrity": "sha512-um+2dgAWmYsu615EXpWVwSmapJhON0G43t3Ka/EVaohzPQXSMqKEqeDK/oIW3Ow+BXaF2PvSc+oBTFp793A5Ow==",
      "license": "Apache-2.0"
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-url": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/is-url/-/is-url-1.2.4.tgz",
      "integrity": "sha512-ITvGim8FhRiYe4IQ5uHSkj7pVaPDrCTkNd3yq3cV7iZAcJdHTUMPMEHcqSOy9xZ9qFenQCvi+2wjH9a1nXqHww==",
      "license": "MIT"
    },
    "node_modules/locate-path": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-5.0.0.tgz",
      "integrity": "sha512-t7hw9pI+WvuwNJXwk5zVHpyhIqzg2qTlklJOf0mVxGSbe3Fp2VieZcduNYjaLDoy6p9uGpQEGWG87WpMKlNq8g==",
      "license": "MIT",
      "dependencies": {
        "p-locate": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/meshoptimizer": {
      "version": "0.22.0",
      "resolved": "https://registry.npmjs.org/meshoptimizer/-/meshoptimizer-0.22.0.tgz",
      "integrity": "sha512-IebiK79sqIy+E4EgOr+CAw+Ke8hAspXKzBd0JdgEmPHiAwmvEj2S4h1rfvo+o/BnfEYd/jAOg5IeeIjzlzSnDg==",
      "dev": true,
      "license": "MIT"
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
    "node_modules/node-fetch": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/node-fetch/-/node-fetch-2.7.0.tgz",
      "integrity": "sha512-c4FRfUm/dbcWZ7U+1Wq0AwCyFL+3nt2bEw05wfxSz+DWpWsitgmSgYmy2dQdWyKC1694ELPqMs/YzUSNozLt8A==",
      "license": "MIT",
      "dependencies": {
        "whatwg-url": "^5.0.0"
      },
      "engines": {
        "node": "4.x || >=6.0.0"
      },
      "peerDependencies": {
        "encoding": "^0.1.0"
      },
      "peerDependenciesMeta": {
        "encoding": {
          "optional": true
        }
      }
    },
    "node_modules/opencollective-postinstall": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/opencollective-postinstall/-/opencollective-postinstall-2.0.3.tgz",
      "integrity": "sha512-8AV/sCtuzUeTo8gQK5qDZzARrulB3egtLzFgteqB2tcT4Mw7B8Kt7JcDHmltjz6FOAHsvTevk70gZEbhM4ZS9Q==",
      "license": "MIT",
      "bin": {
        "opencollective-postinstall": "index.js"
      }
    },
    "node_modules/p-limit": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-2.3.0.tgz",
      "integrity": "sha512-//88mFWSJx8lxCzwdAABTJL2MyWB12+eIY7MDL2SqLmAkeKU9qxRvWuSyTjm3FUmpBEMuFfckAIqEaVGUDxb6w==",
      "license": "MIT",
      "dependencies": {
        "p-try": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-4.1.0.tgz",
      "integrity": "sha512-R79ZZ/0wAxKGu3oYMlz8jy/kbhsNrS7SKZ7PxEHBgJ5+F2mtFW2fK2cOtBh1cHYkQsbzFV7I+EoRKe6Yt0oK7A==",
      "license": "MIT",
      "dependencies": {
        "p-limit": "^2.2.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/p-try": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/p-try/-/p-try-2.2.0.tgz",
      "integrity": "sha512-R4nPAVTAU0B9D35/Gk3uJf/7XYbQcyohSKdvAxIRSNghFl4e71hVoGnBNQz9cWaXxO2I10KTC+3jMdvvoKw6dQ==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/pdfjs-dist": {
      "version": "6.4.299",
      "resolved": "https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-6.4.299.tgz",
      "integrity": "sha512-AVl138zALtfaAPvADulE0PZThbYzCBS79nL4pOSL/6Sm/4AH5A21BD9VHt97OlCuzJuCpmeZtAtkinisF4Vb1g==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=22.13.0 || >=24"
      },
      "optionalDependencies": {
        "@napi-rs/canvas": "^1.0.10"
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
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/pngjs/-/pngjs-5.0.0.tgz",
      "integrity": "sha512-40QW5YalBNfQo5yRYmiw7Yz6TKKVr3h6970B2YE+3fQpsWcrbj1PzJgxeJ19DRQjhMbKPIuMY8rFaXc8moolVw==",
      "license": "MIT",
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.30",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.30.tgz",
      "integrity": "sha512-zkd+e9S1AQHhmaBKye9zlFHWjOwVgqXl1q3ECYy8561K7qxR2cREf/STLskulBFd78k6AOFeA+ff1TtEzk9bAA==",
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
        "nanoid": "^3.3.20",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/prettier": {
      "version": "3.9.10",
      "resolved": "https://registry.npmjs.org/prettier/-/prettier-3.9.10.tgz",
      "integrity": "sha512-skGHTH1Yb9QvaTC4hWnRTzEYtCpApF0UMBPz+t/0ZPzP8ihefo/btKd+QA7pUE0fEwA1SbS/NmhyEcstdXOIdA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "prettier": "bin/prettier.cjs"
      },
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/prettier/prettier?sponsor=1"
      }
    },
    "node_modules/qrcode": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/qrcode/-/qrcode-1.5.4.tgz",
      "integrity": "sha512-1ca71Zgiu6ORjHqFBDpnSMTR2ReToX4l1Au1VFLyVeBTFavzQnv5JxMFr3ukHVKpSrSA2MCk0lNJSykjUfz7Zg==",
      "license": "MIT",
      "dependencies": {
        "dijkstrajs": "^1.0.1",
        "pngjs": "^5.0.0",
        "yargs": "^15.3.1"
      },
      "bin": {
        "qrcode": "bin/qrcode"
      },
      "engines": {
        "node": ">=10.13.0"
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
    "node_modules/regenerator-runtime": {
      "version": "0.13.11",
      "resolved": "https://registry.npmjs.org/regenerator-runtime/-/regenerator-runtime-0.13.11.tgz",
      "integrity": "sha512-kY1AZVr2Ra+t+piVaJ4gxaFaReZVH40AKNo7UCX6W+dEwBo/2oZJzqfuN1qLq1oL45o56cPaTXELwrTh8Fpggg==",
      "license": "MIT"
    },
    "node_modules/require-directory": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/require-directory/-/require-directory-2.1.1.tgz",
      "integrity": "sha512-fGxEI7+wsG9xrvdjsrlmL22OMTTiHRwAMroiEeMgq8gzoLC/PQr7RsRDSTLUg/bZAZtF+TVIkHc6/4RIKrui+Q==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/require-main-filename": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/require-main-filename/-/require-main-filename-2.0.0.tgz",
      "integrity": "sha512-NKN5kMDylKuldxYLSUfrbo5Tuzh4hd+2E8NPPX02mZtn1VuREQToYe/ZdlJy+J3uCpfaiGF05e7B8W0iXbQHmg==",
      "license": "ISC"
    },
    "node_modules/rollup": {
      "version": "4.64.5",
      "resolved": "https://registry.npmjs.org/rollup/-/rollup-4.64.5.tgz",
      "integrity": "sha512-EAP5ZHcz2ijbgCWwPkpI7zh6bfsri2Ez5FtCy2dCp1k62duXzfG7DLGGh7RU2QQXWwavT+u4qpvDF/TWOiiGTw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "1.0.9"
      },
      "bin": {
        "rollup": "dist/bin/rollup"
      },
      "engines": {
        "node": ">=18.0.0",
        "npm": ">=8.0.0"
      },
      "optionalDependencies": {
        "@napi-rs/lzma-linux-x64-gnu": "1.5.1",
        "@rollup/rollup-android-arm-eabi": "4.64.5",
        "@rollup/rollup-android-arm64": "4.64.5",
        "@rollup/rollup-darwin-arm64": "4.64.5",
        "@rollup/rollup-darwin-x64": "4.64.5",
        "@rollup/rollup-freebsd-arm64": "4.64.5",
        "@rollup/rollup-freebsd-x64": "4.64.5",
        "@rollup/rollup-linux-arm-gnueabihf": "4.64.5",
        "@rollup/rollup-linux-arm-musleabihf": "4.64.5",
        "@rollup/rollup-linux-arm64-gnu": "4.64.5",
        "@rollup/rollup-linux-arm64-musl": "4.64.5",
        "@rollup/rollup-linux-loong64-gnu": "4.64.5",
        "@rollup/rollup-linux-loong64-musl": "4.64.5",
        "@rollup/rollup-linux-ppc64-gnu": "4.64.5",
        "@rollup/rollup-linux-ppc64-musl": "4.64.5",
        "@rollup/rollup-linux-riscv64-gnu": "4.64.5",
        "@rollup/rollup-linux-riscv64-musl": "4.64.5",
        "@rollup/rollup-linux-s390x-gnu": "4.64.5",
        "@rollup/rollup-linux-x64-gnu": "4.64.5",
        "@rollup/rollup-linux-x64-musl": "4.64.5",
        "@rollup/rollup-openbsd-x64": "4.64.5",
        "@rollup/rollup-openharmony-arm64": "4.64.5",
        "@rollup/rollup-win32-arm64-msvc": "4.64.5",
        "@rollup/rollup-win32-ia32-msvc": "4.64.5",
        "@rollup/rollup-win32-x64-gnu": "4.64.5",
        "@rollup/rollup-win32-x64-msvc": "4.64.5",
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/scheduler": {
      "version": "0.28.0",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.28.0.tgz",
      "integrity": "sha512-juorfCmIkIw8tT+p5BXSm6PJjQF/ycEYmKyzURCIt/RaZIhL+PulbQ9Yu2z1HdOJDdqDTlxA1+xKBmHXJsczAw==",
      "license": "MIT"
    },
    "node_modules/set-blocking": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/set-blocking/-/set-blocking-2.0.0.tgz",
      "integrity": "sha512-KiKBS8AnWGEyLzofFfmvKwpdPzqiy16LvQfK3yv/fVH7Bj13/wl3JSR1J+rfgRE9q7xUJK4qvgS8raSOeLUehw==",
      "license": "ISC"
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
    "node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/tesseract.js": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/tesseract.js/-/tesseract.js-7.0.0.tgz",
      "integrity": "sha512-exPBkd+z+wM1BuMkx/Bjv43OeLBxhL5kKWsz/9JY+DXcXdiBjiAch0V49QR3oAJqCaL5qURE0vx9Eo+G5YE7mA==",
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "dependencies": {
        "bmp-js": "^0.1.0",
        "idb-keyval": "^6.2.0",
        "is-url": "^1.2.4",
        "node-fetch": "^2.6.9",
        "opencollective-postinstall": "^2.0.3",
        "regenerator-runtime": "^0.13.3",
        "tesseract.js-core": "^7.0.0",
        "wasm-feature-detect": "^1.8.0",
        "zlibjs": "^0.3.1"
      }
    },
    "node_modules/tesseract.js-core": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/tesseract.js-core/-/tesseract.js-core-7.0.0.tgz",
      "integrity": "sha512-WnNH518NzmbSq9zgTPeoF8c+xmilS8rFIl1YKbk/ptuuc7p6cLNELNuPAzcmsYw450ca6bLa8j3t0VAtq435Vw==",
      "license": "Apache-2.0"
    },
    "node_modules/three": {
      "version": "0.180.0",
      "resolved": "https://registry.npmjs.org/three/-/three-0.180.0.tgz",
      "integrity": "sha512-o+qycAMZrh+TsE01GqWUxUIKR1AL0S8pq7zDkYOQw8GqfX8b8VoCKYUoHbhiX5j+7hr8XsuHDVU6+gkQJQKg9w==",
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
    "node_modules/tr46": {
      "version": "0.0.3",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-0.0.3.tgz",
      "integrity": "sha512-N3WMsuqV66lT30CrXNbEjx4GEwlow3v6rr4mCcv6prnfwhS01rkgyFdjPNBYd9br7LpXV1+Emh01fHnq2Gdgrw==",
      "license": "MIT"
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
      "version": "8.9.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-8.9.0.tgz",
      "integrity": "sha512-KTDyRTYX8sWmKXAikPHHSyc63CRPETMctyjKFupcC6OBLXT3xsN0e9aF7m+mIXutFWpUXuedtowG7iLOzp0kQg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/vite": {
      "version": "7.3.7",
      "resolved": "https://registry.npmjs.org/vite/-/vite-7.3.7.tgz",
      "integrity": "sha512-AHEzTORMbi7/7aXp7w7KZ5+DCUdSeLsJz0grY8xHpc9DHdYb0vQu6DqJfm2tOw3gDExNgPgnJTXxM6syYFHaCA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "esbuild": "^0.27.0 || ^0.28.0",
        "fdir": "^6.5.0",
        "picomatch": "^4.0.3",
        "postcss": "^8.5.6",
        "rollup": "^4.43.0",
        "tinyglobby": "^0.2.15"
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
        "jiti": ">=1.21.0",
        "less": "^4.0.0",
        "lightningcss": "^1.21.0",
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
        "jiti": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "lightningcss": {
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
    "node_modules/wasm-feature-detect": {
      "version": "1.9.0",
      "resolved": "https://registry.npmjs.org/wasm-feature-detect/-/wasm-feature-detect-1.9.0.tgz",
      "integrity": "sha512-zonE+xlIIYtxPy++L24ow0hAD8CICb4+FgPyROd3buyXIqsJvUEDkBgfCCoXOd1Hu3DUr0GOfnPIdcGV+YpNaA==",
      "license": "Apache-2.0"
    },
    "node_modules/webidl-conversions": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-3.0.1.tgz",
      "integrity": "sha512-2JAn3z8AR6rjK8Sm8orRC0h/bcl/DqL7tRPdGZ4I1CjdF+EaMLmYxBHyXuKL849eucPFhvBoxMsflfOb8kxaeQ==",
      "license": "BSD-2-Clause"
    },
    "node_modules/whatwg-url": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-5.0.0.tgz",
      "integrity": "sha512-saE57nupxk6v3HY35+jzBwYa0rKSy0XR8JSxZPwgLr7ys0IBzhGviA1/TUGJLmSVqs8pb9AnvICXEuOHLprYTw==",
      "license": "MIT",
      "dependencies": {
        "tr46": "~0.0.3",
        "webidl-conversions": "^3.0.0"
      }
    },
    "node_modules/which-module": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/which-module/-/which-module-2.0.1.tgz",
      "integrity": "sha512-iBdZ57RDvnOR9AGBhML2vFZf7h8vmBjhoaZqODJBFWHVtKkDmKuHai3cx5PgVMrX5YDNp27AofYbAwctSS+vhQ==",
      "license": "ISC"
    },
    "node_modules/wrap-ansi": {
      "version": "6.2.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-6.2.0.tgz",
      "integrity": "sha512-r6lPcBGxZXlIcymEu7InxDMhdW0KDxpLgoFLcguasxCaJ/SOIZwINatK9KY/tf+ZrlywOKU0UDj3ATXUBfxJXA==",
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/y18n": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/y18n/-/y18n-4.0.3.tgz",
      "integrity": "sha512-JKhqTOwSrqNA1NY5lSztJ1GrBiUodLMmIZuLiDaMRJ+itFd+ABVE8XBjOvIWL+rSqNDC74LCSFmlb/U4UZ4hJQ==",
      "license": "ISC"
    },
    "node_modules/yargs": {
      "version": "15.4.1",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-15.4.1.tgz",
      "integrity": "sha512-aePbxDmcYW++PaqBsJ+HYUFwCdv4LVvdnhBy78E57PIor8/OVvhMrADFFEDh8DHDFRv/O9i3lPhsENjO7QX0+A==",
      "license": "MIT",
      "dependencies": {
        "cliui": "^6.0.0",
        "decamelize": "^1.2.0",
        "find-up": "^4.1.0",
        "get-caller-file": "^2.0.1",
        "require-directory": "^2.1.1",
        "require-main-filename": "^2.0.0",
        "set-blocking": "^2.0.0",
        "string-width": "^4.2.0",
        "which-module": "^2.0.0",
        "y18n": "^4.0.0",
        "yargs-parser": "^18.1.2"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/yargs-parser": {
      "version": "18.1.3",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-18.1.3.tgz",
      "integrity": "sha512-o50j0JeToy/4K6OZcaQmW6lyXXKhq7csREXcDwk2omFPJEwUNOVtJKvmDr9EI1fAJZUyZcRF7kxGBWmRXudrCQ==",
      "license": "ISC",
      "dependencies": {
        "camelcase": "^5.0.0",
        "decamelize": "^1.2.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/zlibjs": {
      "version": "0.3.1",
      "resolved": "https://registry.npmjs.org/zlibjs/-/zlibjs-0.3.1.tgz",
      "integrity": "sha512-+J9RrgTKOmlxFSDHo0pI1xM6BLVUv+o0ZT9ANtCxGkjIVCCUdx9alUF8Gm+dGLKbkkkidWIHFDZHDMpfITt4+w==",
      "license": "MIT",
      "engines": {
        "node": "*"
      }
    }
  }
}
````

## package.json

````json
{
  "name": "autohub-3d",
  "version": "0.3.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc --noEmit && vite build",
    "test": "node --experimental-strip-types --test tests/*.test.ts",
    "preview": "vite preview --host 127.0.0.1",
    "predev": "node scripts/prepare-ocr.mjs && node scripts/prepare-credits.mjs",
    "prebuild": "node scripts/prepare-ocr.mjs && node scripts/prepare-credits.mjs",
    "assets:import": "node scripts/import-assets.mjs",
    "format": "prettier --write src server/*.ts tests scripts index.html package.json tsconfig.json vite.config.ts",
    "verify:scan": "node --experimental-strip-types scripts/verify-scan.mjs",
    "speech:setup": "node scripts/setup-speech.mjs",
    "verify:api": "node --experimental-strip-types scripts/verify-api.mjs"
  },
  "dependencies": {
    "@fontsource/dm-sans": "^5.3.0",
    "@phosphor-icons/react": "^2.1.10",
    "pdfjs-dist": "^6.4.299",
    "qrcode": "^1.5.4",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tesseract.js": "^7.0.0",
    "three": "^0.180.0"
  },
  "devDependencies": {
    "@napi-rs/canvas": "^1.0.11",
    "@types/qrcode": "^1.5.6",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@types/three": "^0.180.0",
    "prettier": "^3.9.10",
    "typescript": "^5.9.3",
    "vite": "^7.1.9"
  }
}

````

## research/transcribe.py

````python
from faster_whisper import WhisperModel
from pathlib import Path
import wave,numpy as np
model=WhisperModel('base',device='cpu',compute_type='int8',download_root='/private/tmp/autohub-whisper-models',cpu_threads=4)
for i,name in enumerate(['WhatsApp Video 2026-10-13 at 02.17.31.mp4','WhatsApp Video 2026-10-13 at 02.17.41.mp4'],1):
 with wave.open(f'/private/tmp/autohub-reel-{i}.wav') as w: audio=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
 segments,info=model.transcribe(audio,language='fr',beam_size=5,vad_filter=True)
 lines=[f'[{s.start:05.1f}–{s.end:05.1f}] {s.text.strip()}' for s in segments]
 Path(f'research/transcription-reel-{i}.txt').write_text('\n'.join(lines),encoding='utf-8')
 print(f'REEL {i}\n'+ '\n'.join(lines),flush=True)

````

## scripts/import-assets.mjs

````javascript
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = process.cwd();
if (path.basename(root) !== "CRM 3D GARAGE")
  throw Error("Importer uniquement depuis la racine AutoHub.");
const original = path.join(root, "research/catalogue/kenney-original");
const license = await readFile(path.join(original, "License.txt"), "utf8");
if (!license.includes("CC0"))
  throw Error("La licence CC0 originale est nécessaire.");
const names = [
  "sedan",
  "sedan-sports",
  "suv",
  "suv-luxury",
  "hatchback-sports",
  "van",
  "delivery",
  "delivery-flat",
  "truck",
  "truck-flat",
];
const entries = [];
const failures = [];
await mkdir("public/models/previews", { recursive: true });
await copyFile(
  path.join(original, "License.txt"),
  "public/models/kenney-license.txt",
);
for (const name of names) {
  try {
    const originalBytes = await readFile(
      path.join(original, "Models/GLB format", name + ".glb"),
    );
    let bytes = originalBytes;
    if (
      bytes.readUInt32LE(0) !== 0x46546c67 ||
      bytes.readUInt32LE(4) !== 2 ||
      bytes.readUInt32LE(8) !== bytes.length
    )
      throw Error("GLB structure invalid");
    const gltf = JSON.parse(
      bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
    );
    if ((gltf.buffers || []).some((b) => b.uri))
      throw Error("External buffers are not allowed");
    let binary = bytes.subarray(28 + bytes.readUInt32LE(12));
    for (const image of gltf.images || []) {
      if (!image.uri) continue;
      if (image.uri !== "Textures/colormap.png")
        throw Error("Unapproved image resource");
      const png = await readFile(
        path.join(original, "Models/GLB format", image.uri),
      );
      const offset = binary.length;
      binary = Buffer.concat([
        binary,
        png,
        Buffer.alloc((4 - (png.length % 4)) % 4),
      ]);
      gltf.bufferViews ||= [];
      image.bufferView = gltf.bufferViews.length;
      gltf.bufferViews.push({
        buffer: 0,
        byteOffset: offset,
        byteLength: png.length,
      });
      image.mimeType = "image/png";
      delete image.uri;
    }
    gltf.buffers[0].byteLength = binary.length;
    let json = Buffer.from(JSON.stringify(gltf));
    json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 32)]);
    const header = Buffer.alloc(20);
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + json.length + binary.length, 8);
    header.writeUInt32LE(json.length, 12);
    header.writeUInt32LE(0x4e4f534a, 16);
    const bh = Buffer.alloc(8);
    bh.writeUInt32LE(binary.length, 0);
    bh.writeUInt32LE(0x004e4942, 4);
    bytes = Buffer.concat([header, json, bh, binary]);
    const triangles = (gltf.meshes || [])
      .flatMap((m) => m.primitives)
      .reduce(
        (n, p) =>
          n +
          (p.mode === undefined || p.mode === 4
            ? gltf.accessors[p.indices ?? p.attributes.POSITION].count / 3
            : 0),
        0,
      );
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await writeFile("public/models/" + name + ".glb", bytes);
    await copyFile(
      path.join(original, "Previews", name + ".png"),
      "public/models/previews/" + name + ".png",
    );
    entries.push({
      id: "kenney-" + name,
      kind: "vehicle",
      name: name.replaceAll("-", " "),
      make: "Générique",
      model: name,
      category: name.startsWith("suv")
        ? "suv"
        : name.includes("hatch")
          ? "hatch"
          : "sedan",
      source: "https://kenney.nl/assets/car-kit",
      creator: "Kenney",
      license: "CC0-1.0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
      licenseStatus: "verified",
      verifiedAt: "2026-10-13",
      licenseProof: "/models/kenney-license.txt",
      commercial: true,
      redistribution: true,
      noAI: false,
      attribution: "Kenney — Car Kit 3.1 (CC0)",
      format: "GLB",
      triangles: Math.round(triangles),
      bytes: bytes.length,
      sha256,
      status: "imported",
      validation:
        "GLB structure, embedded resources and SHA-256; no antivirus available",
      url: "/models/" + name + ".glb",
      preview: "/models/previews/" + name + ".png",
      generic: true,
      enabled: true,
    });
  } catch (error) {
    failures.push({ name, error: String(error) });
  }
}
const csv = await readFile("research/catalogue/catalogue-source.csv", "utf8");
for (const [i, line] of csv
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .entries()) {
  const [type, name, source, license, triangles] = line.split(",");
  entries.push({
    id: "source-" + i,
    kind: type === "vehicule" ? "vehicle" : "mechanical",
    name,
    make: name.startsWith("BMW")
      ? "BMW"
      : name.startsWith("Mercedes")
        ? "Mercedes"
        : "Illustration mécanique",
    model: name,
    source,
    creator: null,
    license,
    licenseStatus: "license_review_required",
    verifiedAt: null,
    commercial: null,
    redistribution: null,
    noAI: license.includes("NoAI"),
    format: null,
    triangles: Number(triangles),
    bytes: 0,
    sha256: null,
    status: "not_downloaded",
    url: null,
    preview: null,
    generic: type !== "vehicule",
    enabled: false,
  });
}
try {
  const existing = JSON.parse(
    await readFile("public/models/manifest.json", "utf8"),
  );
  for (const item of existing.entries.filter((e) => e.id === "spectral-gt"))
    entries.push(item);
} catch {}
const manifest = {
  version: 1,
  generatedAt: "2026-10-13",
  entries,
  failures,
  stats: {
    referenced: entries.length,
    licensesVerified: entries.filter((e) => e.licenseStatus === "verified")
      .length,
    downloaded: entries.filter((e) => e.status === "imported").length,
    knownBrandModelsImported: 0,
    genericVehiclesImported: entries.filter((e) => e.status === "imported")
      .length,
    externalModelsAwaitingReview: 10,
  },
};
await writeFile(
  "public/models/manifest.json",
  JSON.stringify(manifest, null, 2),
);
await writeFile(
  "research/catalogue/import-report.json",
  JSON.stringify({ stats: manifest.stats, failures }, null, 2),
);
console.log(JSON.stringify(manifest.stats));
if (failures.length) process.exitCode = 1;

````

## scripts/import-detailed-model.mjs

````javascript
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const bytes = await readFile("public/models/spectral-gt.glb");
const license = await readFile("public/models/spectral-license.txt", "utf8");
if (!license.includes("CC0")) throw Error("Licence manquante.");
if (
  bytes.readUInt32LE(0) !== 0x46546c67 ||
  bytes.readUInt32LE(8) !== bytes.length
)
  throw Error("GLB invalide.");
const g = JSON.parse(
  bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
);
if (g.buffers.some((b) => b.uri) || g.images?.some((i) => i.uri))
  throw Error("Ressource externe non autorisée.");
const triangles = Math.round(
  g.meshes
    .flatMap((m) => m.primitives)
    .reduce(
      (n, p) => n + g.accessors[p.indices ?? p.attributes.POSITION].count / 3,
      0,
    ),
);
const manifest = JSON.parse(
  await readFile("public/models/manifest.json", "utf8"),
);
const entry = {
  id: "spectral-gt",
  kind: "vehicle",
  name: "Spectral GT RS · coupé détaillé non marqué",
  make: "Création originale, sans marque attestée",
  model: "Spectral GT RS",
  category: "sedan",
  source: "https://github.com/JaronKBragg7337/spectral-gt-rs",
  creator: "JaronKBragg7337",
  license: "CC0-1.0",
  licenseStatus: "verified",
  verifiedAt: "2026-10-13",
  licenseProof: "/models/spectral-license.txt",
  commercial: true,
  redistribution: true,
  noAI: false,
  attribution:
    "JaronKBragg7337 — Spectral GT RS (CC0). Ne pas impliquer un soutien de l’auteur.",
  format: "GLB",
  triangles,
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  status: "imported",
  validation: "Header, length, embedded resources, SHA-256. Visual QA pending.",
  url: "/models/spectral-gt.glb",
  preview: "/models/previews/spectral-gt.png",
  generic: true,
  enabled: true,
  frontAxis: "positiveX",
};
manifest.entries = [
  ...manifest.entries.filter((a) => a.id !== entry.id),
  entry,
];
manifest.stats = {
  ...manifest.stats,
  referenced: manifest.entries.length,
  licensesVerified: manifest.entries.filter(
    (a) => a.licenseStatus === "verified",
  ).length,
  downloaded: manifest.entries.filter((a) => a.status === "imported").length,
  genericVehiclesImported: manifest.entries.filter(
    (a) => a.status === "imported" && a.kind === "vehicle",
  ).length,
  knownBrandModelsImported: 0,
};
await writeFile(
  "public/models/manifest.json",
  JSON.stringify(manifest, null, 2),
);
console.log({
  imported: entry.id,
  triangles,
  bytes: bytes.length,
  knownBrandModelsImported: 0,
});

````

## scripts/prepare-credits.mjs

````javascript
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
} from "node:fs/promises";
const names = [
  "react",
  "react-dom",
  "three",
  "@phosphor-icons/react",
  "@fontsource/dm-sans",
  "pdfjs-dist",
  "tesseract.js",
  "tesseract.js-core",
  "qrcode",
];
await mkdir("public/licenses", { recursive: true });
const entries = [];
for (const name of names) {
  const base = "node_modules/" + name;
  const p = JSON.parse(await readFile(base + "/package.json", "utf8"));
  const files = (await readdir(base)).filter((f) =>
    /^license(?:\.|$)|^ofl(?:\.|$)/i.test(f),
  );
  for (const f of files)
    await copyFile(
      base + "/" + f,
      "public/licenses/" + name.replaceAll("/", "-").replace("@", "") + "-" + f,
    );
  entries.push({
    name,
    version: p.version,
    license: p.license,
    files: files.map(
      (f) =>
        "/licenses/" + name.replaceAll("/", "-").replace("@", "") + "-" + f,
    ),
  });
}
await copyFile(
  "node_modules/tesseract.js/dist/worker.min.js.LICENSE.txt",
  "public/ocr/worker-license.txt",
);
await writeFile(
  "public/licenses/dependencies.json",
  JSON.stringify(entries, null, 2),
);
console.log("Licences des dépendances conservées.");

````

## scripts/prepare-ocr.mjs

````javascript
import { copyFile, readdir, mkdir, access } from "node:fs/promises";
await mkdir("public/ocr", { recursive: true });
await access("public/ocr/fra.traineddata.gz");
await copyFile(
  "node_modules/tesseract.js/dist/worker.min.js",
  "public/ocr/worker.min.js",
);
for (const file of await readdir("node_modules/tesseract.js-core"))
  if (/^tesseract-core.*\.(js|wasm)$/.test(file))
    await copyFile(
      "node_modules/tesseract.js-core/" + file,
      "public/ocr/" + file,
    );
await copyFile(
  "node_modules/tesseract.js-core/LICENSE",
  "public/ocr/engine-license.txt",
);
console.log("Moteur OCR préparé pour un traitement intégralement local.");

````

## scripts/setup-speech.mjs

````javascript
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, HF_HUB_DISABLE_IMPLICIT_TOKEN: "1" },
  });
  if (result.status !== 0) process.exit(result.status || 1);
};
mkdirSync(".data", { recursive: true });
run("python3", ["-m", "venv", ".speech-venv"]);
run(".speech-venv/bin/python3", [
  "-m",
  "pip",
  "install",
  "faster-whisper==1.2.1",
]);
run(".speech-venv/bin/python3", [
  "-c",
  "from faster_whisper import WhisperModel; from pathlib import Path; import shutil; m=WhisperModel('base',device='cpu',compute_type='int8',download_root='.data/whisper-cache'); p=next(Path('.data/whisper-cache/models--Systran--faster-whisper-base/snapshots').glob('*/config.json')).parent; shutil.copytree(p,'.data/speech-model',dirs_exist_ok=True)",
]);
console.log(
  "Reconnaissance française installée localement. Aucun service vocal payant.",
);

````

## scripts/verify-api.mjs

````javascript
import { createServer } from "node:http";
import { mkdtemp, rm, readFile, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { autohubAPI } from "../server/plugin.ts";
const folder = await mkdtemp(join(tmpdir(), "autohub-api-"));
const handlers = [];
const server = createServer((req, res) =>
  handlers[0](req, res, () => {
    res.statusCode = 404;
    res.end();
  }),
);
const plugin = autohubAPI(join(folder, "state.sqlite"));
plugin.configureServer({
  middlewares: { use: (fn) => handlers.push(fn) },
  httpServer: server,
});
await access(join(folder, "state.sqlite"));
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const root = "http://127.0.0.1:" + server.address().port;
const result = [];
const ctrl = new AbortController();
try {
  let state = await (await fetch(root + "/api/state")).json();
  assert.equal(state.db.vehicles.length, 60);
  assert.equal(state.db.parts.length, 50);
  result.push("HTTP state: coherent 60 dossiers / 50 parts");
  const stream = await fetch(root + "/api/events", { signal: ctrl.signal });
  const reader = stream.body.getReader();
  let buffer = "";
  const readEvent = async () => {
    for (;;) {
      if (buffer.includes("\n\n")) {
        const index = buffer.indexOf("\n\n"),
          message = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (message.startsWith("data: ")) return JSON.parse(message.slice(6));
      }
      const chunk = await reader.read();
      if (chunk.done) throw Error("Flux interrompu");
      buffer += new TextDecoder().decode(chunk.value);
    }
  };
  const initial = await readEvent();
  assert.equal(initial.revision, 0);
  const change = {
    requestId: crypto.randomUUID(),
    revision: 0,
    type: "start",
    vehicle: "v1",
    payload: {},
  };
  const response = await fetch(root + "/api/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(change),
  });
  assert.equal(response.status, 200);
  state = await response.json();
  assert.ok(state.db.workshop.v1.runningSince);
  const event = await readEvent();
  assert.equal(event.revision, 1);
  result.push("SSE: second client receives the persisted action");
  const duplicate = await (
    await fetch(root + "/api/change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    })
  ).json();
  assert.equal(duplicate.revision, 1);
  const stale = await fetch(root + "/api/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...change,
      requestId: crypto.randomUUID(),
      type: "pause",
    }),
  });
  assert.equal(stale.status, 409);
  result.push("Duplicate request and concurrent edit guarded");
  const proposal = await (
    await fetch(root + "/api/voice/propose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicle: "v1",
        text: "Il me manque un étrier avant droit pour la BMW. Mets l’intervention en pause et préviens le responsable.",
        mode: "command",
      }),
    })
  ).json();
  assert.deepEqual(
    proposal.actions.map((a) => a.type),
    ["pause", "piece", "alert"],
  );
  result.push("Structured voice proposal via HTTP");
  const caps = await (await fetch(root + "/api/speech/capabilities")).json();
  assert.equal(caps.local, true);
  if (caps.available) {
    const audio = await readFile(".data/test-command.aiff");
    const response = await fetch(root + "/api/speech/transcribe", {
      method: "POST",
      headers: { "Content-Type": "audio/aiff" },
      body: audio,
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.ok(/étrier/i.test(data.text));
    assert.equal(data.local, true);
    result.push(
      "Synthetic French audio transcribed through local HTTP pipeline",
    );
  }
  await writeFile(
    "research/verification-api-v2.json",
    JSON.stringify(
      { at: new Date().toISOString(), isolated: true, checks: result },
      null,
      2,
    ),
  );
  console.log(result.join("\n"));
} finally {
  ctrl.abort();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await rm(folder, { recursive: true, force: true });
}

````

## scripts/verify-scan.mjs

````javascript
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { createWorker } from "tesseract.js";
import { extractRegistration } from "../src/identification.ts";
globalThis.DOMMatrix ||= DOMMatrix;
globalThis.ImageData ||= ImageData;
globalThis.Path2D ||= Path2D;
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const results = [];
const get = (fields, code) => fields.find((f) => f.code === code)?.value;
const nativeTask = pdfjs.getDocument({
  data: new Uint8Array(
    await readFile("public/demo/carte-grise-fictive-texte.pdf"),
  ),
  useSystemFonts: true,
});
const nativePDF = await nativeTask.promise;
const page = await nativePDF.getPage(1);
const content = await page.getTextContent();
let text = "",
  lastY = null;
for (const item of content.items) {
  if (!("str" in item)) continue;
  if (lastY !== null && Math.abs(item.transform[5] - lastY) > 3) text += "\n";
  text += item.str + " ";
  if (item.hasEOL) text += "\n";
  lastY = item.transform[5];
}
const fields = extractRegistration(text, "pdf_text");
assert.equal(get(fields, "A"), "DEMO-002");
assert.equal(get(fields, "D.1"), "RENAULT");
assert.equal(get(fields, "D.3"), "CLIO");
assert.equal(get(fields, "E"), "VF1AAAAA123456789");
const view = page.getViewport({ scale: 1.5 });
const nativeCanvas = createCanvas(
  Math.round(view.width),
  Math.round(view.height),
);
await page.render({
  canvas: nativeCanvas,
  canvasContext: nativeCanvas.getContext("2d"),
  viewport: view,
}).promise;
await writeFile(
  "research/carte-grise-fictive-texte-preview.png",
  nativeCanvas.toBuffer("image/png"),
);
await nativeTask.destroy();
results.push({
  input: "PDF texte fictif",
  method: "PDF.js text extraction",
  fieldsVerified: ["A", "D.1", "D.3", "E"],
  result: "pass",
});
console.log("PDF texte : quatre champs vérifiés.");
const worker = await createWorker("fra", 1, {
  langPath: path.resolve("public/ocr"),
  cacheMethod: "none",
});
try {
  for (const [name, filename] of [
    ["Photo fictive", "carte-grise-fictive-photo.png"],
    ["PDF scanné fictif", "carte-grise-fictive-scan.pdf"],
  ]) {
    let image = await readFile("public/demo/" + filename);
    if (filename.endsWith(".pdf")) {
      const task = pdfjs.getDocument({
        data: new Uint8Array(image),
        useSystemFonts: true,
      });
      const pdf = await task.promise;
      try {
        const page = await pdf.getPage(1);
        const view = page.getViewport({ scale: 1.8 });
        const canvas = createCanvas(
          Math.round(view.width),
          Math.round(view.height),
        );
        await page.render({
          canvas,
          canvasContext: canvas.getContext("2d"),
          viewport: view,
        }).promise;
        image = canvas.toBuffer("image/png");
      } finally {
        await task.destroy();
      }
    }
    const result = await worker.recognize(image);
    const fields = extractRegistration(result.data.text, "ocr_local");
    await writeFile(
      "research/" + filename.replace(/\.(png|pdf)$/, ".ocr.txt"),
      result.data.text,
    );
    for (const [code, expected] of [
      ["A", "DEMO-002"],
      ["D.1", "RENAULT"],
      ["D.3", "CLIO"],
      ["E", "VF1AAAAA123456789"],
    ])
      assert.equal(get(fields, code), expected, `${name} ${code}`);
    results.push({
      input: name,
      method: "Tesseract French local OCR",
      fieldsVerified: ["A", "D.1", "D.3", "E"],
      result: "pass",
    });
    console.log(name + " : quatre champs vérifiés.");
  }
} finally {
  await worker.terminate();
}
await writeFile(
  "research/verification-scan.json",
  JSON.stringify(
    {
      at: new Date().toISOString(),
      scope:
        "Engine integration with fictitious clean fixtures. Browser file chooser verification blocked; does not establish accuracy on real cards.",
      results,
    },
    null,
    2,
  ),
);

````

## server/plugin.ts

````typescript
import { mkdirSync, existsSync } from "node:fs";
import { writeFile, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execute = promisify(execFile);
import type { IncomingMessage, ServerResponse } from "node:http";
import { Store } from "./store.ts";
import { proposeVoice } from "../src/voice-domain.ts";
export function autohubAPI(databaseFile = ".data/autohub.sqlite") {
  let store: Store | undefined;
  const clients = new Set<ServerResponse>();
  const start = (server: any) => {
    mkdirSync(".data", { recursive: true });
    store ||= new Store(databaseFile);
    const broadcast = () => {
      const state = store!.read();
      for (const client of clients)
        client.write("data: " + JSON.stringify(state) + "\n\n");
    };
    server.middlewares.use(
      async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const path = req.url?.split("?")[0];
        if (!path?.startsWith("/api/")) return next();
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        const json = (code: number, value: any) => {
          res.statusCode = code;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(value));
        };
        try {
          if (
            req.headers.origin &&
            new URL(req.headers.origin).host !== req.headers.host
          )
            return json(403, { error: "Origine non autorisée." });
          if (path === "/api/speech/capabilities" && req.method === "GET")
            return json(200, {
              available:
                existsSync(".speech-venv/bin/python3") &&
                existsSync(".data/speech-model/model.bin"),
              local: true,
            });
          if (path === "/api/state" && req.method === "GET")
            return json(200, store!.read());
          if (path === "/api/events" && req.method === "GET") {
            res.writeHead(200, {
              "Content-Type": "text/event-stream",
              Connection: "keep-alive",
            });
            res.write("data: " + JSON.stringify(store!.read()) + "\n\n");
            clients.add(res);
            const heartbeat = setInterval(() => res.write(": ping\n\n"), 15000);
            res.on("close", () => {
              clearInterval(heartbeat);
              clients.delete(res);
            });
            return;
          }
          if (req.method !== "POST")
            return json(405, { error: "Méthode non autorisée." });
          const chunks: Buffer[] = [];
          let bytes = 0;
          for await (const chunk of req) {
            bytes += chunk.length;
            if (bytes > 24 * 1024 * 1024)
              return json(413, { error: "Requête trop volumineuse." });
            chunks.push(Buffer.from(chunk));
          }
          const bytesBuffer = Buffer.concat(chunks);
          if (path === "/api/speech/transcribe") {
            if (bytesBuffer.length > 8 * 1024 * 1024)
              return json(413, { error: "Audio trop volumineux." });
            if (
              !existsSync(".speech-venv/bin/python3") ||
              !existsSync(".data/speech-model/model.bin")
            )
              return json(503, {
                error:
                  "Installez la reconnaissance locale avec npm run speech:setup.",
              });
            mkdirSync(".data/audio", { recursive: true, mode: 0o700 });
            const filename = ".data/audio/" + crypto.randomUUID() + ".audio";
            await writeFile(filename, bytesBuffer, { mode: 0o600 });
            try {
              const { stdout } = await execute(
                ".speech-venv/bin/python3",
                ["server/transcribe.py", filename],
                { timeout: 90000, maxBuffer: 1024 * 1024 },
              );
              return json(200, JSON.parse(stdout.trim()));
            } finally {
              await unlink(filename).catch(() => {});
            }
          }
          const body = JSON.parse(bytesBuffer.toString());
          if (path === "/api/voice/propose")
            return json(
              200,
              proposeVoice(
                store!.read().db,
                body.vehicle,
                body.text,
                body.mode,
              ),
            );
          if (path === "/api/change") {
            const result = store!.change(body);
            json(200, result);
            broadcast();
            return;
          }
          return json(404, { error: "Route inconnue." });
        } catch (e) {
          json((e as any).status || 400, { error: (e as Error).message });
        }
      },
    );
    server.httpServer?.once("close", () => {
      for (const c of clients) c.end();
      clients.clear();
      store?.close();
      store = undefined;
    });
  };
  return {
    name: "autohub-local-api",
    configureServer: start,
    configurePreviewServer: start,
  };
}

````

## server/store.ts

````typescript
import { DatabaseSync } from "node:sqlite";
import { seed, loadDB, type DB } from "../src/domain.ts";
import {
  toggleWork,
  pauseWork,
  finishWork,
  approveRequest,
  resolveIssue,
  reportIssue,
  requestPart,
} from "../src/workshop-domain.ts";
import { applyVoice, proposeVoice } from "../src/voice-domain.ts";
import { planningAlerts } from "../src/planning-domain.ts";
function activeDemo() {
  const db = seed();
  const now = Date.now();
  for (const [index, id] of ["v1", "v5", "v6"].entries()) {
    const state = db.workshop![id];
    state.elapsed = 0;
    state.runningSince = new Date(now - (20 + index * 7) * 60000).toISOString();
    state.events = [
      {
        type: "start",
        at: state.runningSince,
        reason: "Session de démonstration fictive",
      },
    ];
  }
  return db;
}
export type Snapshot = { db: DB; revision: number; serverNow: number };
export class Store {
  sql: DatabaseSync;
  constructor(file: string, initial: () => DB = activeDemo) {
    this.sql = new DatabaseSync(file);
    this.sql.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY, response TEXT NOT NULL); CREATE TABLE IF NOT EXISTS history(revision INTEGER PRIMARY KEY,payload TEXT NOT NULL,at TEXT NOT NULL);",
    );
    if (!this.sql.prepare("SELECT id FROM state WHERE id=1").get())
      this.sql
        .prepare("INSERT INTO state VALUES(1,0,?)")
        .run(JSON.stringify(initial()));
  }
  read(): Snapshot {
    const row = this.sql
      .prepare("SELECT revision,payload FROM state WHERE id=1")
      .get()!;
    return {
      db: loadDB(String(row.payload)),
      revision: Number(row.revision),
      serverNow: Date.now(),
    };
  }
  change(
    request: {
      requestId: string;
      revision: number;
      type: string;
      vehicle?: string;
      payload?: any;
    },
    now = Date.now(),
  ): Snapshot {
    if (!/^[a-zA-Z0-9-]{5,100}$/.test(request.requestId))
      throw Error("Identifiant de requête invalide.");
    const oldReceipt = this.sql
      .prepare("SELECT response FROM receipts WHERE id=?")
      .get(request.requestId);
    if (oldReceipt)
      return { ...JSON.parse(String(oldReceipt.response)), serverNow: now };
    this.sql.exec("BEGIN IMMEDIATE");
    try {
      const previous = this.read();
      if (previous.revision !== request.revision)
        throw Object.assign(
          Error(
            "Les données ont changé sur un autre écran. Actualisez avant de confirmer.",
          ),
          { status: 409 },
        );
      let next = previous.db;
      const id = request.vehicle || "",
        p = request.payload || {};
      if (request.type === "snapshot") {
        next = loadDB(JSON.stringify(p.db));
        for (const v of previous.db.vehicles) {
          const old = previous.db.workshop?.[v.id],
            updated = next.workshop?.[v.id];
          if (
            old &&
            updated &&
            (old.runningSince !== updated.runningSince ||
              old.elapsed !== updated.elapsed)
          )
            throw Error(
              "Utilisez une action atelier pour modifier le chronomètre serveur.",
            );
        }
        for (const a of planningAlerts(next)) {
          if (
            ["technician_conflict", "resource_conflict", "skill"].includes(
              a.code,
            ) &&
            !planningAlerts(previous.db).some(
              (old) => old.code === a.code && old.appointment === a.appointment,
            )
          )
            throw Error(a.message);
        }
      } else if (request.type === "start") {
        if (!next.workshop?.[id]?.runningSince)
          next = toggleWork(next, id, now);
      } else if (request.type === "pause")
        next = pauseWork(
          next,
          id,
          String(p.reason || "Pause manuelle"),
          false,
          now,
        );
      else if (request.type === "finish") next = finishWork(next, id, now);
      else if (request.type === "voice")
        next = applyVoice(
          next,
          id,
          String(p.text || ""),
          String(p.mode || "command"),
          p.confirmed === true,
          now,
        );
      else if (request.type === "request")
        next = requestPart(
          next,
          id,
          String(p.part || ""),
          Number(p.quantity || 1),
          now,
        );
      else if (request.type === "issue")
        next = reportIssue(
          next,
          id,
          String(p.text || ""),
          "Incident mécanique",
          now,
        );
      else if (request.type === "approve")
        next = approveRequest(
          next,
          id,
          String(p.requestId || ""),
          p.compatibilityConfirmed === true,
          now,
        );
      else if (request.type === "resolve")
        next = resolveIssue(
          next,
          id,
          String(p.issueId || ""),
          String(p.decision || ""),
          now,
        );
      else if (request.type === "import") next = loadDB(JSON.stringify(p.db));
      else if (request.type === "reset") next = activeDemo();
      else throw Error("Action inconnue.");
      const previousAudit = new Set(previous.db.audit.map((a) => a.id));
      next = {
        ...next,
        audit: next.audit.map((a) =>
          previousAudit.has(a.id)
            ? a
            : { ...a, at: new Date(now).toISOString() },
        ),
      };
      next = loadDB(JSON.stringify(next));
      for (const vehicle of next.vehicles) {
        if (
          ["Prêt à livrer", "Livré"].includes(vehicle.status) &&
          !vehicle.quality
        )
          throw Error("Contrôle qualité requis avant restitution.");
        const old = previous.db.vehicles.find((v) => v.id === vehicle.id);
        if (
          request.type !== "import" &&
          request.type !== "reset" &&
          vehicle.status === "Livré" &&
          old &&
          old.status !== "Prêt à livrer" &&
          old.status !== "Livré"
        )
          throw Error(
            "Le véhicule doit passer en prêt à livrer avant livraison.",
          );
      }
      const bays = next.vehicles
        .filter(
          (v) => v.present !== false && v.status !== "Livré" && v.bay !== null,
        )
        .map((v) => v.bay);
      if (new Set(bays).size !== bays.length)
        throw Error("Un pont physique ne peut pas accueillir deux véhicules.");
      for (const p of next.parts)
        if (p.stock < 0 || p.reserved < 0 || p.reserved > p.stock)
          throw Error("Mouvement de stock invalide.");
      const result = {
        db: next,
        revision: previous.revision + 1,
        serverNow: now,
      };
      this.sql
        .prepare("INSERT INTO history VALUES(?,?,?)")
        .run(
          previous.revision,
          JSON.stringify(previous.db),
          new Date(now).toISOString(),
        );
      this.sql
        .prepare("DELETE FROM history WHERE revision < ?")
        .run(Math.max(0, result.revision - 20));
      this.sql
        .prepare("UPDATE state SET revision=?,payload=? WHERE id=1")
        .run(result.revision, JSON.stringify(next));
      this.sql
        .prepare("INSERT INTO receipts VALUES(?,?)")
        .run(request.requestId, JSON.stringify(result));
      this.sql.exec(
        "DELETE FROM receipts WHERE rowid IN (SELECT rowid FROM receipts ORDER BY rowid DESC LIMIT -1 OFFSET 256)",
      );
      this.sql.exec("COMMIT");
      return result;
    } catch (e) {
      this.sql.exec("ROLLBACK");
      throw e;
    }
  }
  close() {
    this.sql.close();
  }
}

````

## server/transcribe.py

````python
import sys,subprocess,tempfile,wave,json
import numpy as np
from faster_whisper import WhisperModel
from pathlib import Path
root=Path(__file__).resolve().parent.parent
(root/'.data/audio').mkdir(parents=True,exist_ok=True)
with tempfile.NamedTemporaryFile(suffix='.wav',dir=root/'.data/audio') as output:
 subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-i',sys.argv[1],'-t','30','-ar','16000','-ac','1',output.name],check=True,timeout=30)
 with wave.open(output.name) as w: audio=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
 model=WhisperModel(str(root/'.data/speech-model'),device='cpu',compute_type='int8',cpu_threads=4,local_files_only=True)
 segments,info=model.transcribe(audio,language='fr',beam_size=5,vad_filter=True)
 print(json.dumps({'text':' '.join(s.text.strip() for s in segments),'language':'fr','local':True},ensure_ascii=False))

````

## src/AssetLibrary.tsx

````tsx
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  MagnifyingGlass,
  ShieldCheck,
  Cube,
  DownloadSimple,
  ArrowRight,
  WarningCircle,
} from "@phosphor-icons/react";
import { loadVehicleAsset, disposeObject, type Asset } from "./assets";
import { record, updateVehicle, type DB } from "./domain";
export function ModelPreview({ id }: { id: string }) {
  const host = useRef<HTMLDivElement>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!host.current) return;
    const node = host.current;
    let disposed = false;
    let frame = 0;
    let group: THREE.Group | null = null;
    setError("");
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setError("Aperçu 3D indisponible.");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(node.clientWidth, node.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    node.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e5ece7");
    const camera = new THREE.PerspectiveCamera(
      42,
      node.clientWidth / node.clientHeight,
      0.1,
      100,
    );
    camera.position.set(6, 3.8, 6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.7, 0);
    controls.enableDamping = true;
    controls.maxDistance = 20;
    controls.minDistance = 3;
    scene.add(new THREE.HemisphereLight("#ffffff", "#718578", 3));
    const light = new THREE.DirectionalLight("#ffffff", 3);
    light.position.set(-4, 6, 5);
    scene.add(light);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: "#d5dfd6", roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.03;
    scene.add(floor);
    loadVehicleAsset(id)
      .then((g) => {
        if (disposed) {
          disposeObject(g);
          return;
        }
        group = g;
        scene.add(g);
      })
      .catch(() => setError("Chargement du GLB impossible."));
    const ro = new ResizeObserver(() => {
      camera.aspect = node.clientWidth / Math.max(node.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(node.clientWidth, node.clientHeight);
    });
    ro.observe(node);
    const render = () => {
      if (disposed) return;
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      if (group) disposeObject(group);
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [id]);
  return (
    <div className="model-preview" ref={host}>
      {error && <span>{error}</span>}
    </div>
  );
}
export function AssetLibrary({
  db,
  commit,
}: {
  db: DB;
  commit: (fn: (db: DB) => DB, message?: string) => void;
}) {
  const [assets, setAssets] = useState<Asset[]>([]),
    [targets, setTargets] = useState<{ make: string; model: string }[]>([]),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState("kenney-sedan"),
    [vehicle, setVehicle] = useState(db.vehicles[0]?.id || "");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/models/brand-catalogue.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((m) => setTargets(m.models))
      .catch(() => {});
    fetch("/models/manifest.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((m) => setAssets(m.entries))
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("Le manifeste local est indisponible.");
      });
    return () => controller.abort();
  }, []);
  const available = assets.filter((a) => a.status === "imported"),
    item = assets.find((a) => a.id === selected),
    disabled = db.assetDisabled || [];
  const shown = assets.filter(
    (a) =>
      (a.name + " " + a.make).toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "imported" && a.status === "imported") ||
        (filter === "review" && a.licenseStatus !== "verified")),
  );
  return (
    <section className="asset-library">
      <div className="catalogue-stats">
        <div>
          <strong>{assets.length}</strong>
          <span>Références recensées</span>
        </div>
        <div>
          <strong>{available.length}</strong>
          <span>GLB locaux importés</span>
        </div>
        <div>
          <strong>
            {assets.filter((a) => a.licenseStatus === "verified").length}
          </strong>
          <span>Licences vérifiées</span>
        </div>
        <div>
          <strong>
            {available.filter((a) => !a.generic).length}{" "}
            <small>/ {targets.length || 10}</small>
          </strong>
          <span>Véhicules de marque importés</span>
        </div>
      </div>
      <div className="subtle-note">
        <ShieldCheck />
        <span>
          Modèles génériques Kenney CC0 et création originale détaillée Spectral
          GT RS. Ils ne constituent pas des modèles attestés de marques connues.
          Les dix liens Sketchfab fournis restent non téléchargés et leurs
          licences non vérifiées.
        </span>
      </div>
      <details className="content-card brand-targets">
        <summary>
          Première collection de marque · 5 marques, 10 modèles à importer
        </summary>
        <p>
          Année, génération, auteur et licence doivent être vérifiés avant
          rattachement automatique. Le téléchargement Sketchfab nécessite une
          connexion. Ces objectifs ne sont pas comptés comme des modèles
          importés.
        </p>
        <div className="brand-target-grid">
          {targets.map((t) => (
            <a
              key={t.make + t.model}
              href={
                "https://sketchfab.com/search?type=models&features=downloadable&q=" +
                encodeURIComponent(t.make + " " + t.model)
              }
              target="_blank"
              rel="noreferrer"
            >
              <strong>
                {t.make} {t.model}
              </strong>
              <small>Rechercher un modèle téléchargeable ↗</small>
            </a>
          ))}
        </div>
      </details>
      {error && <div className="notice">{error}</div>}
      <div className="library-layout">
        <section className="content-card">
          <div className="section-head">
            <div className="search">
              <MagnifyingGlass size={18} />
              <input
                aria-label="Rechercher un modèle 3D"
                placeholder="Nom, marque…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              aria-label="Filtrer les actifs"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tous les actifs</option>
              <option value="imported">GLB importés</option>
              <option value="review">Licences à vérifier</option>
            </select>
          </div>
          <div className="asset-grid">
            {shown.map((a) => (
              <button
                className={
                  "asset-tile " + (selected === a.id ? "selected" : "")
                }
                key={a.id}
                onClick={() => setSelected(a.id)}
              >
                {a.preview ? (
                  <img src={a.preview} alt={a.name} />
                ) : (
                  <span className="asset-placeholder">
                    <Cube size={40} />
                  </span>
                )}
                <strong>{a.name}</strong>
                <span>{a.make}</span>
                <small
                  className={
                    a.status === "imported" ? "text-green" : "text-amber"
                  }
                >
                  {a.status === "imported"
                    ? disabled.includes(a.id)
                      ? "Désactivé"
                      : "GLB local · CC0"
                    : "Source à vérifier"}
                </small>
              </button>
            ))}
          </div>
        </section>
        <aside className="content-card asset-detail">
          {item && (
            <>
              {item.status === "imported" ? (
                <ModelPreview id={item.id} />
              ) : (
                <div className="asset-blocked">
                  <WarningCircle size={38} />
                  <p>Aucun fichier local. L’actif n’est pas publié.</p>
                </div>
              )}
              <span className="eyebrow">
                {item.generic ? "ILLUSTRATION GÉNÉRIQUE" : "MODÈLE À VÉRIFIER"}
              </span>
              <h2>{item.name}</h2>
              <dl>
                <dt>Créateur</dt>
                <dd>{item.creator || "Non vérifié"}</dd>
                <dt>Licence</dt>
                <dd>
                  {item.license}
                  {item.licenseStatus !== "verified"
                    ? " · annoncée, non vérifiée"
                    : ""}
                </dd>
                <dt>Vérification</dt>
                <dd>{item.verifiedAt || "À effectuer"}</dd>
                <dt>Triangles</dt>
                <dd>
                  {item.triangles.toLocaleString("fr-FR")}
                  {item.status !== "imported" ? " environ" : ""}
                </dd>
                <dt>Taille locale</dt>
                <dd>
                  {item.bytes
                    ? Math.round(item.bytes / 1024) + " Ko"
                    : "Aucun fichier"}
                </dd>
                <dt>NoAI</dt>
                <dd>
                  {item.noAI
                    ? "Restriction annoncée à conserver"
                    : "Non signalé"}
                </dd>
              </dl>
              <a
                className="text-button"
                href={item.source}
                target="_blank"
                rel="noreferrer"
              >
                Fiche source
                <ArrowRight />
              </a>
              {item.licenseProof && (
                <a
                  className="text-button"
                  href={item.licenseProof}
                  target="_blank"
                  rel="noreferrer"
                >
                  Licence conservée
                </a>
              )}
              {item.sha256 && (
                <p className="asset-hash">SHA-256 : {item.sha256}</p>
              )}
              {item.status === "imported" && (
                <>
                  <a className="secondary full" href={item.url!} download>
                    <DownloadSimple size={18} />
                    Télécharger le GLB
                  </a>
                  <label>
                    Associer à un dossier
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                    >
                      {db.vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} · {v.plate}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="primary full"
                    disabled={disabled.includes(item.id) || !vehicle}
                    onClick={() =>
                      commit(
                        (d) => updateVehicle(d, vehicle, { assetId: item.id }),
                        "Modèle générique associé au dossier.",
                      )
                    }
                  >
                    Confirmer la représentation 3D
                  </button>
                  <button
                    className="secondary full"
                    onClick={() =>
                      commit(
                        (d) =>
                          record(
                            {
                              ...d,
                              assetDisabled: disabled.includes(item.id)
                                ? disabled.filter((id) => id !== item.id)
                                : [...disabled, item.id],
                            },
                            "catalogue",
                            disabled.includes(item.id)
                              ? "Actif 3D réactivé"
                              : "Actif 3D désactivé",
                          ),
                        "Catalogue mis à jour.",
                      )
                    }
                  >
                    {disabled.includes(item.id)
                      ? "Réactiver cet actif"
                      : "Désactiver cet actif"}
                  </button>
                </>
              )}
              <p className="warning-small">
                La représentation 3D ne confirme jamais une compatibilité de
                pièce.{" "}
                {item.attribution ||
                  "Licence et droits SaaS à vérifier avant utilisation."}
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

````

## src/DeliveryDeadline.tsx

````tsx
import { useEffect, useState } from "react";
import { serverNow } from "./api";
import type { DB, Vehicle } from "./domain";
export function DeliveryDeadline({
  db,
  vehicle,
}: {
  db: DB;
  vehicle: Vehicle;
}) {
  const [now, setNow] = useState(serverNow());
  useEffect(() => {
    const interval = setInterval(() => setNow(serverNow()), 30000);
    return () => clearInterval(interval);
  }, []);
  const appointment = db.appointments?.find(
    (a) => a.vehicle === vehicle.id && a.state !== "Terminé",
  );
  const deadline = appointment ? Date.parse(appointment.promised) : NaN;
  const minutes = (deadline - now) / 60000;
  const ready = ["Prêt à livrer", "Livré"].includes(vehicle.status);
  const tone = ready
    ? "ready"
    : minutes < 0
      ? "late"
      : minutes <= 120
        ? "soon"
        : "normal";
  return (
    <span className={`delivery-deadline ${tone}`}>
      <strong>
        {Number.isFinite(deadline)
          ? new Date(deadline).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : vehicle.due}
      </strong>
      <small>
        {ready
          ? "Véhicule prêt"
          : minutes < 0
            ? "Échéance dépassée"
            : minutes <= 120
              ? "Livraison proche"
              : "Restitution prévue"}
      </small>
    </span>
  );
}

````

## src/GuidedContext.tsx

````tsx
import { team } from "./team-data";
import { DeliveryDeadline } from "./DeliveryDeadline";
import { quoteTotals } from "./quote-domain";
import { zones, statuses, type DB } from "./domain";
import {
  showroomCars,
  waitingVehicles,
  zoneVehicles,
  todaysOrders,
  awaitingOrders,
} from "./guided-domain";
import type { Selection } from "./scene";
export function GuidedContext({
  db,
  selection,
  onSelect,
  onView,
  onReception,
  onClose,
}: {
  db: DB;
  selection: Selection;
  onSelect: (s: Selection) => void;
  onView: (v: string) => void;
  onReception: () => void;
  onClose: () => void;
}) {
  const zone = selection.id;
  const showroom = showroomCars(db);
  const cars =
    zone === "attente" || zone === "accueil"
      ? waitingVehicles(db)
      : zoneVehicles(db, zone);
  const inventory =
    selection.kind === "inventory" ? showroom.find((v) => v.id === zone) : null;
  return (
    <>
      <div className="panel-top">
        <strong>
          {inventory
            ? "VÉHICULE DU SHOWROOM"
            : zones.find((z) => z.id === zone)?.name || "Votre espace"}
        </strong>
        <button
          className="icon-button"
          aria-label="Revenir au plan"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="guided-context">
        {zone === "atelier" && (
          <div className="spatial-stats">
            <strong>{cars.length} véhicules</strong>
            <span>
              {cars.filter((v) => v.status === "En intervention").length}{" "}
              interventions
            </span>
            <span>
              {cars.filter((v) => v.status === "Devis à valider").length}{" "}
              accords attendus
            </span>
          </div>
        )}
        {zone === "livraison" && (
          <div className="spatial-stats">
            <strong>{cars.length} véhicules prêts</strong>
            <span>
              Choisissez une voiture pour suivre sa restitution et ses messages.
            </span>
          </div>
        )}
        {inventory ? (
          <>
            <h2>
              {inventory.make} {inventory.model}
            </h2>
            <p>
              {inventory.year} ·{" "}
              {inventory.available ? "Disponible" : "Indisponible"}
            </p>
            <p className="notice">
              Stock commercial de démonstration. Représentation générique,
              modèle exact non importé.
            </p>
          </>
        ) : zone === "showroom" ? (
          <>
            <h2>Véhicules disponibles</h2>
            <p className="warning-small">
              Inventaire de démonstration · illustrations génériques.
            </p>
            {showroom
              .filter((v) => v.available)
              .map((v) => (
                <button
                  className="vehicle-row"
                  key={v.id}
                  onClick={() => onSelect({ kind: "inventory", id: v.id })}
                >
                  <span>
                    <strong>
                      {v.make} {v.model}
                    </strong>
                    <small>{v.year} · Disponible</small>
                  </span>
                </button>
              ))}
            {!showroom.length && <p>Aucun véhicule commercial enregistré.</p>}
          </>
        ) : zone === "stock" ? (
          <>
            <h2>Commandes & arrivages</h2>
            <p>
              Préparations internes et commandes en attente. Aucun envoi
              fournisseur automatique.
            </p>
            <h3>Aujourd’hui · {todaysOrders(db).length}</h3>
            {todaysOrders(db).map((o) => (
              <div className="guided-item" key={o.id}>
                <strong>{db.parts.find((p) => p.id === o.part)?.name}</strong>
                <span>
                  {o.quantity} unité(s) · {o.status}
                </span>
              </div>
            ))}
            {!todaysOrders(db).length && (
              <p>Aucune commande horodatée aujourd’hui.</p>
            )}
            <h3>En attente · {awaitingOrders(db).length}</h3>
            {awaitingOrders(db).map((o) => (
              <div className="guided-item" key={o.id}>
                <strong>
                  {db.parts.find((p) => p.id === o.part)?.name || o.part}
                </strong>
                <span>
                  {o.quantity} unité(s) · {o.status}
                </span>
                <small>
                  {o.at
                    ? new Date(o.at).toLocaleString("fr-FR")
                    : "Date non renseignée"}
                </small>
              </div>
            ))}
            {!db.orders.length && <p>Aucune commande enregistrée.</p>}
            <button className="primary full" onClick={() => onView("stocks")}>
              Ouvrir les stocks
            </button>
          </>
        ) : zone === "bureau" ? (
          <>
            <h2>Responsable d’atelier</h2>
            <p>
              {db.quotes?.filter((q) => q.state === "À valider").length || 0}{" "}
              devis à valider ·{" "}
              {db.alerts?.filter((a) => !a.resolved).length || 0} alertes
              ouvertes
            </p>
            <button className="primary full" onClick={() => onView("pilotage")}>
              Voir les alertes
            </button>
            <button className="secondary full" onClick={() => onView("devis")}>
              Voir les devis
            </button>
          </>
        ) : (
          <>
            <h2>
              {zone === "accueil"
                ? "Accueil des clients"
                : zone === "attente"
                  ? "Clients en attente"
                  : zone === "livraison"
                    ? "Véhicules prêts"
                    : "Dossiers de cette zone"}
            </h2>
            {(zone === "attente" || zone === "accueil") && (
              <p className="warning-small">
                Présences simulées dans le garage de démonstration.
              </p>
            )}
            {cars.map((v) => (
              <button
                className="vehicle-row"
                key={v.id}
                onClick={() =>
                  onSelect({
                    kind:
                      zone === "attente" || zone === "accueil"
                        ? "customer"
                        : "vehicle",
                    id: v.id,
                  })
                }
              >
                <span>
                  <strong>
                    {zone === "attente" || zone === "accueil"
                      ? v.client
                      : `${v.make} ${v.model}`}
                  </strong>
                  <small>
                    {v.plate} · {v.status}
                  </small>
                </span>
              </button>
            ))}
            {!cars.length && <p>Aucun dossier dans cette zone.</p>}
            {zone === "atelier" && (
              <>
                <h3>Équipe de l’atelier</h3>
                {team.map((t) => (
                  <button
                    className="vehicle-row"
                    key={t.id}
                    onClick={() => onSelect({ kind: "technician", id: t.name })}
                  >
                    <span>
                      <strong>{t.name}</strong>
                      <small>{t.specialty}</small>
                    </span>
                  </button>
                ))}
              </>
            )}
            {zone === "accueil" && (
              <button className="primary full" onClick={onReception}>
                Accueillir un véhicule
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export function ClientContext({
  db,
  vehicle,
  onVehicle,
  onQuotes,
  onClose,
}: {
  db: DB;
  vehicle: import("./domain").Vehicle;
  onVehicle: () => void;
  onQuotes: () => void;
  onClose: () => void;
}) {
  const quote = (db.quotes || [])
    .filter((q) => q.vehicle === vehicle.id)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
  const total = quote ? quoteTotals(quote).total : 0;
  return (
    <>
      <div className="panel-top">
        <strong>DOSSIER CLIENT</strong>
        <button
          className="icon-button"
          aria-label="Revenir au plan"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="guided-context">
        <h2>{vehicle.client}</h2>
        <p>
          {vehicle.make} {vehicle.model} · {vehicle.plate}
        </p>
        <div className="guided-item">
          <strong>Étape actuelle</strong>
          <span>{vehicle.status}</span>
          <small>
            {vehicle.status === "Prêt à livrer"
              ? "Contrôle qualité validé · véhicule à récupérer"
              : "Réparation en cours de suivi"}
          </small>
        </div>
        {quote ? (
          <div className="guided-item">
            <strong>Dernier devis · {quote.state}</strong>
            <span>
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
              }).format(total)}{" "}
              TTC
            </span>
            <small>
              {quote.state === "Validé"
                ? "Accord client enregistré"
                : "Accord non enregistré"}
            </small>
            {quote.lines.map((l) => (
              <span key={l.id}>{l.label}</span>
            ))}
          </div>
        ) : (
          <p>Aucun devis enregistré.</p>
        )}
        <ol className="client-progress" aria-label="Étapes du dossier">
          {statuses.map((s) => (
            <li
              key={s}
              aria-current={s === vehicle.status ? "step" : undefined}
            >
              {s}
            </li>
          ))}
        </ol>
        <DeliveryDeadline db={db} vehicle={vehicle} />
        <button className="primary full" onClick={onVehicle}>
          Voir son véhicule dans l’atelier
        </button>
        <button className="secondary full" onClick={onQuotes}>
          Consulter les devis
        </button>
      </div>
    </>
  );
}

export function VehicleSummary({
  db,
  vehicle: v,
  onDetails,
  onClose,
}: {
  db: DB;
  vehicle: DB["vehicles"][number];
  onDetails: () => void;
  onClose: () => void;
}) {
  const events = db.audit
    .filter((a) => a.vehicle === v.id)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);
  const drafts = db.messages.filter((m) => m.vehicle === v.id);
  const quote = db.quotes
    ?.filter((q) => q.vehicle === v.id)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  return (
    <>
      <div className="panel-top">
        <strong>VÉHICULE · SYNTHÈSE</strong>
        <button aria-label="Fermer la synthèse" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="guided-context">
        <h2>
          {v.make} {v.model}
        </h2>
        <p>
          {v.plate} · {v.client}
        </p>
        <div className="guided-item">
          <strong>{v.status}</strong>
          <span>Contrôle qualité : {v.quality ? "validé" : "à valider"}</span>
        </div>
        {quote && (
          <div className="guided-item">
            <strong>Devis · {quote.state}</strong>
            <span>
              {quoteTotals(quote).total.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>
        )}
        <DeliveryDeadline db={db} vehicle={v} />
        <div className="guided-item">
          <strong>SMS de récupération · aucun envoi confirmé</strong>
          <span>
            {drafts.length
              ? "Message WhatsApp préparé, non envoyé."
              : "Aucun message préparé."}
          </span>
          <small>Le service SMS n’est pas connecté.</small>
        </div>
        <h3>Derniers événements</h3>
        {events.length ? (
          events.map((e) => (
            <div className="guided-item" key={e.id}>
              <strong>{e.action}</strong>
              <small>{new Date(e.at).toLocaleString("fr-FR")}</small>
            </div>
          ))
        ) : (
          <p>Aucun événement enregistré.</p>
        )}
        <button className="primary" onClick={onDetails}>
          Ouvrir le dossier complet
        </button>
      </div>
    </>
  );
}

````

## src/Intelligence.tsx

````tsx
import { useState } from "react";
import {
  Brain,
  MagnifyingGlass,
  ShieldCheck,
  ArrowUpRight,
  FileArrowUp,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { searchDiagnostics, extractDTC } from "./diagnostic-domain";
import { VoiceAssistant } from "./VoiceAssistant";
import { identifyLocal } from "./identification";
import type { DB } from "./domain";
export function Intelligence({
  db,
  onOpen,
  commit,
  onAction,
  initialVehicle,
}: {
  db: DB;
  initialVehicle?: string;
  onOpen: (id: string) => void;
  commit: (fn: (d: DB) => DB, message?: string) => unknown;
  onAction: (id: string, type: string, payload: any) => Promise<boolean>;
}) {
  const [vehicle, setVehicle] = useState(
      initialVehicle ||
        db.vehicles.find((v) => v.present && v.status !== "Livré")?.id ||
        "",
    ),
    [query, setQuery] = useState(
      initialVehicle
        ? (db.vehicles.find((v) => v.id === initialVehicle)?.symptoms || "") +
            " " +
            (db.vehicles.find((v) => v.id === initialVehicle)?.codes || "")
        : "",
    ),
    [identity, setIdentity] = useState(""),
    [source, setSource] = useState(""),
    [voice, setVoice] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const car = db.vehicles.find((v) => v.id === vehicle);
  const results = searchDiagnostics(db, query, vehicle);
  const count = db.diagnosticCases?.length || 0;
  async function report(file: File) {
    setError("");
    if (file.size > 10 * 1024 * 1024) {
      setError("Limite de 10 Mo.");
      return;
    }
    setBusy(true);
    try {
      let text = "";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        const { default: url } =
          await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = url;
        const task = pdfjs.getDocument({
          data: new Uint8Array(await file.arrayBuffer()),
        });
        try {
          const pdf = await task.promise;
          if (pdf.numPages > 5) throw Error("Cinq pages maximum.");
          for (let n = 1; n <= pdf.numPages; n++) {
            const page = await pdf.getPage(n);
            const data = await page.getTextContent();
            text +=
              data.items
                .filter((i) => "str" in i)
                .map((i) => (i as any).str)
                .join(" ") + "\n";
          }
          if (!text.trim())
            throw Error(
              "PDF image : utilisez AutoHub Scan pour lire le document, puis collez le texte ici.",
            );
        } finally {
          await task.destroy();
        }
      } else if (
        ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("fra", 1, {
          workerPath: "/ocr/worker.min.js",
          corePath: "/ocr",
          langPath: "/ocr",
          workerBlobURL: false,
          cacheMethod: "none",
        });
        try {
          text = (await worker.recognize(file)).data.text;
        } finally {
          await worker.terminate();
        }
      } else if (/\.(txt|csv)$/i.test(file.name)) text = await file.text();
      else throw Error("Formats : PDF texte, TXT, CSV, JPG ou PNG.");
      const codes = extractDTC(text);
      setSource(text);
      setQuery(codes.length ? codes.join(" ") : text.slice(0, 1500));
      if (!codes.length)
        setError(
          "Aucun code DTC standard retrouvé. Examinez le texte ; aucun défaut n’est supposé.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="intelligence-v2">
      <section className="content-card diagnostic">
        <div className="brain-icon">
          <Brain size={32} />
        </div>
        <span className="eyebrow">GARAGE INTELLIGENT · MÉMOIRE DU CRM</span>
        <h2>Expliquez-moi votre cas.</h2>
        <p>
          {count} dossiers techniques fictifs, chacun relié à un véhicule
          enregistré. La recherche repose sur les mots-clés, codes, modèle et
          motorisation renseignée.
        </p>
        <label>
          Véhicule existant
          <select
            aria-label="Véhicule du diagnostic"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            {db.vehicles.map((v) => (
              <option value={v.id} key={v.id}>
                {v.make} {v.model} · {v.plate}
              </option>
            ))}
          </select>
        </label>
        <label>
          Plaque ou VIN
          <input
            aria-label="Identifier le véhicule du diagnostic"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="Recherche interne, aucun lookup externe"
          />
        </label>
        <button
          className="secondary"
          onClick={() => {
            const result = identifyLocal(
              db,
              identity.trim().length === 17
                ? { vin: identity }
                : { plate: identity },
            );
            if (result.matches.length === 1) setVehicle(result.matches[0].id);
            setError(result.message);
          }}
        >
          Retrouver le dossier
        </button>
        <label>
          Symptômes et codes défauts
          <textarea
            aria-label="Symptômes du diagnostic"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Démarrage difficile, direction intermittente, P0562…"
          />
        </label>
        <div className="diagnostic-actions">
          <button
            className="secondary"
            onClick={() => {
              if (car) {
                setQuery(car.symptoms + " " + car.codes);
                setSource("Symptômes enregistrés dans le dossier " + car.plate);
              }
            }}
          >
            Utiliser les symptômes du dossier
          </button>
          <button className="secondary" onClick={() => setVoice(!voice)}>
            Dicter / ajouter une note
          </button>
          <label className="diagnostic-upload">
            <FileArrowUp size={18} />
            {busy ? "Lecture locale…" : "Importer OBD / PDF / photo"}
            <input
              aria-label="Rapport diagnostic à lire"
              type="file"
              disabled={busy}
              accept=".pdf,.txt,.csv,image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) report(f);
              }}
            />
          </label>
        </div>
        {error && (
          <div className="notice">
            <WarningCircle size={18} />
            {error}
          </div>
        )}
        {source && (
          <details>
            <summary>Texte source de la recherche</summary>
            <pre className="report-source">{source}</pre>
          </details>
        )}
        <div className="subtle-note">
          <ShieldCheck />
          <span>
            Illustrations et cas fictifs. Une correspondance ne confirme pas la
            cause actuelle. Les tests manquants et la documentation applicable
            doivent être validés par un technicien qualifié.
          </span>
        </div>
      </section>
      <section className="case-results">
        <div className="section-head">
          <h3>{results.length} dossiers pertinents</h3>
          <span>Causes, preuves et différences visibles</span>
        </div>
        {results.map(({ case: c, vehicle: v, similarities, differences }) => (
          <article className="case-card" key={c.id}>
            <div>
              <span className="small-chip">
                {c.id} · {c.demo ? "Fictif" : "Dossier local"}
              </span>
              <span className={c.resolved ? "text-green" : "text-amber"}>
                {c.resolved
                  ? "Résolution documentée"
                  : "Diagnostic non confirmé"}
              </span>
            </div>
            <h3>
              {v.make} {v.model} · {c.symptoms}
            </h3>
            <p>
              {new Date(c.at).toLocaleDateString("fr-FR")} ·{" "}
              {v.km.toLocaleString("fr-FR")} km · {c.engine}
            </p>
            <div className="case-comparison">
              <div>
                <h4>Correspondances</h4>
                <ul>
                  {similarities.length ? (
                    similarities.map((s) => <li key={s}>{s}</li>)
                  ) : (
                    <li>
                      Présentation du dossier, sans correspondance recherchée.
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4>Différences</h4>
                <ul>
                  {differences.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
            <h4>Codes et tests du dossier source</h4>
            <p>{c.codes.join(" · ") || "Aucun code consigné."}</p>
            {c.tests.map((t) => (
              <div
                className={"diagnostic-test " + (t.done ? "" : "missing")}
                key={t.name}
              >
                {t.done ? (
                  <CheckCircle size={17} />
                ) : (
                  <WarningCircle size={17} />
                )}
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.result}</small>
                </span>
              </div>
            ))}
            <h4>Hypothèses</h4>
            <ul>
              {c.hypotheses.map((h) => (
                <li key={h.label}>
                  {h.label} — {h.state}
                </li>
              ))}
            </ul>
            <h4>Cause confirmée dans ce cas</h4>
            <p>{c.cause || "Aucune cause confirmée."}</p>
            <h4>Réparation et résultat</h4>
            <p>
              {c.repair} {c.result}
              {c.recurred ? " Retour après réparation enregistré." : ""}
            </p>
            <div className="case-controls">
              <button className="secondary" onClick={() => onOpen(v.id)}>
                <ArrowUpRight size={17} />
                Ouvrir le dossier source
              </button>
              {car && (
                <button
                  className="secondary"
                  onClick={() =>
                    commit(
                      (d) => ({
                        ...d,
                        vehicles: d.vehicles.map((x) =>
                          x.id === car.id
                            ? {
                                ...x,
                                notes:
                                  x.notes +
                                  "\nPiste issue de " +
                                  c.id +
                                  " (fictif) : " +
                                  (c.cause || c.hypotheses[0]?.label) +
                                  ". À vérifier ; ne constitue pas un diagnostic.",
                              }
                            : x,
                        ),
                        audit: [
                          {
                            id: crypto.randomUUID(),
                            vehicle: car.id,
                            at: new Date().toISOString(),
                            action: "Piste diagnostic ajoutée depuis " + c.id,
                          },
                          ...d.audit,
                        ],
                      }),
                      "Piste ajoutée avec sa source et son incertitude.",
                    )
                  }
                >
                  Ajouter la piste au dossier actuel
                </button>
              )}
            </div>
          </article>
        ))}
        {!results.length && (
          <div className="content-card empty">
            <MagnifyingGlass size={35} />
            <h3>Aucun dossier similaire enregistré.</h3>
            <p>
              Aucun diagnostic ni référence n’est inventé pour combler ce
              manque.
            </p>
          </div>
        )}
      </section>
      {voice && car && (
        <div className="diagnostic-voice">
          <VoiceAssistant
            db={db}
            vehicle={car.id}
            mode="report"
            onAction={(type, payload) => onAction(car.id, type, payload)}
            onClose={() => setVoice(false)}
          />
        </div>
      )}
    </section>
  );
}

````

## src/ManagerRequests.tsx

````tsx
import { useState } from "react";
import { Package, WarningCircle, CheckCircle } from "@phosphor-icons/react";
import { workshopFor } from "./workshop-domain";
import type { DB } from "./domain";
export function ManagerRequests({
  db,
  onAction,
}: {
  db: DB;
  onAction: (vehicle: string, type: string, payload: any) => Promise<boolean>;
}) {
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({}),
    [decision, setDecision] = useState<Record<string, string>>({});
  const requests = db.vehicles.flatMap((v) =>
    workshopFor(db, v.id)
      .requests.filter(
        (r) =>
          r.state === "À valider responsable" ||
          r.state === "En attente magasin",
      )
      .map((r) => ({ v, r })),
  );
  const issues = db.vehicles.flatMap((v) =>
    workshopFor(db, v.id)
      .issues.filter((i) => i.state !== "Résolu")
      .map((i) => ({ v, i })),
  );
  return (
    <section className="content-card manager-requests">
      <div className="section-head">
        <h3>Décisions du responsable</h3>
        <span className="small-chip">
          {requests.length} demandes · {issues.length} problèmes ouverts
        </span>
      </div>
      {requests.map(({ v, r }) => {
        const p = db.parts.find((p) => p.id === r.part)!;
        const quantity = r.quantity || 1;
        return (
          <article className="manager-request" key={r.id}>
            <Package size={24} />
            <div>
              <h4>
                {quantity} × {p.name}
              </h4>
              <p>
                {v.make} {v.model} · {v.plate} · {p.ref}
              </p>
              <small>
                {p.stock - p.reserved} disponibles · référence fictive · aucun
                achat automatique
              </small>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={!!confirmed[r.id]}
                  onChange={(e) =>
                    setConfirmed({ ...confirmed, [r.id]: e.target.checked })
                  }
                />
                Référence et compatibilité vérifiées pour la démonstration
              </label>
            </div>
            <button
              className="primary"
              disabled={!confirmed[r.id] || p.stock - p.reserved < quantity}
              onClick={() =>
                onAction(v.id, "approve", {
                  requestId: r.id,
                  compatibilityConfirmed: true,
                })
              }
            >
              <CheckCircle size={18} />
              Valider et réserver
            </button>
            {p.stock - p.reserved < quantity && (
              <span className="text-amber">
                Stock insuffisant : réception nécessaire.
              </span>
            )}
          </article>
        );
      })}
      {issues.map(({ v, i }) => (
        <article className="manager-request issue" key={i.id}>
          <WarningCircle size={24} />
          <div>
            <h4>{v.plate} · problème signalé</h4>
            <p>{i.text}</p>
            <input
              aria-label={"Décision pour " + v.plate}
              value={decision[i.id] || ""}
              placeholder="Décision à consigner avant reprise"
              onChange={(e) =>
                setDecision({ ...decision, [i.id]: e.target.value })
              }
            />
          </div>
          <button
            className="secondary"
            disabled={!decision[i.id]?.trim()}
            onClick={() =>
              onAction(v.id, "resolve", {
                issueId: i.id,
                decision: decision[i.id],
              })
            }
          >
            Consigner et lever l’incident
          </button>
        </article>
      ))}
      {!requests.length && !issues.length && (
        <p className="empty">Aucune décision en attente.</p>
      )}
    </section>
  );
}

````

## src/Pilotage.tsx

````tsx
import {
  Car,
  CheckCircle,
  WarningCircle,
  Clock,
  Package,
  ArrowRight,
  FileText,
  Users,
  ChartLine,
} from "@phosphor-icons/react";
import { ManagerRequests } from "./ManagerRequests";
import { dashboard } from "./dashboard-domain";
import type { DB } from "./domain";
export function Pilotage({
  db,
  onOpen,
  onFilter,
  onView,
  commit,
  onAction,
}: {
  db: DB;
  onOpen: (id: string) => void;
  onFilter: (filter: string) => void;
  onView: (view: string) => void;
  commit: (fn: (db: DB) => DB, message?: string) => unknown;
  onAction: (id: string, type: string, payload: any) => Promise<boolean>;
}) {
  const d = dashboard(db);
  const metrics = [
    ["Présents", d.present.length, "present", Car],
    ["En cours", d.running.length, "running", Clock],
    ["Bloqués", d.blocked.length, "blocked", WarningCircle],
    ["Devis validés", d.accepted.length, "devis", FileText],
    ["Devis en attente", d.pending.length, "devis", FileText],
    ["Prêts à livrer", d.ready.length, "ready", CheckCircle],
    ["En retard", d.late.length, "late", Clock],
    ["Techniciens libres", d.availableTech.length, "equipe", Users],
    ["Ponts occupés", d.occupied.length, "planning", ChartLine],
    ["Stock critique", d.critical.length, "stocks", Package],
  ] as const;
  return (
    <section className="pilotage-v2">
      <ManagerRequests db={db} onAction={onAction} />
      <div className="dashboard-grid">
        {metrics.map(([label, count, filter, Icon]) => (
          <button
            className="dashboard-metric"
            key={label}
            onClick={() =>
              ["devis", "equipe", "planning", "stocks"].includes(filter)
                ? onView(filter)
                : onFilter(filter)
            }
          >
            <Icon size={23} />
            <strong>{count}</strong>
            <span>{label}</span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
      <div className="director-grid">
        <article className="content-card">
          <h3>Alertes à traiter</h3>
          {d.alerts.slice(0, 12).map((a) => (
            <button
              className="manager-alert"
              key={a.id}
              onClick={() => onOpen(a.vehicle)}
            >
              <WarningCircle size={22} />
              <span>
                <strong>{a.message}</strong>
                <small>
                  {db.vehicles.find((v) => v.id === a.vehicle)?.plate} ·{" "}
                  {a.kind}
                </small>
              </span>
              <ArrowRight size={18} />
            </button>
          ))}
          {!d.alerts.length && <p className="empty">Aucune alerte ouverte.</p>}
        </article>
        <article className="content-card">
          <h3>Prochaines livraisons</h3>
          {d.ready.map((v) => (
            <button
              className="manager-alert ready"
              key={v.id}
              onClick={() => onOpen(v.id)}
            >
              <CheckCircle size={22} />
              <span>
                <strong>
                  {v.make} {v.model}
                </strong>
                <small>{v.plate} · Contrôle final validé</small>
              </span>
              <ArrowRight size={18} />
            </button>
          ))}
          <h3 className="turnover">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(d.turnover)}
          </h3>
          <p>
            Chiffre d’affaires des factures fictives marquées payées, calculé
            depuis les enregistrements.
          </p>
          <button
            className="secondary full"
            onClick={() => onFilter("invoiced")}
          >
            Voir les dossiers facturés
          </button>
        </article>
      </div>
      <div className="director-grid">
        <article className="content-card">
          <h3>Rendez-vous à venir</h3>
          {d.appointments.slice(0, 6).map((a) => (
            <button
              className="manager-alert"
              key={a.id}
              onClick={() => onOpen(a.vehicle)}
            >
              <Clock size={20} />
              <span>
                <strong>
                  {db.vehicles.find((v) => v.id === a.vehicle)?.make}{" "}
                  {db.vehicles.find((v) => v.id === a.vehicle)?.model}
                </strong>
                <small>
                  {new Date(a.start).toLocaleString("fr-FR", {
                    timeZone: "Europe/Lisbon",
                  })}{" "}
                  · {a.technician}
                </small>
              </span>
            </button>
          ))}
        </article>
        <article className="content-card">
          <h3>Entretiens à vérifier</h3>
          {(db.maintenance || []).map((m) => (
            <button
              className="manager-alert"
              key={m.id}
              onClick={() => onOpen(m.vehicle)}
            >
              <Car size={20} />
              <span>
                <strong>
                  {db.vehicles.find((v) => v.id === m.vehicle)?.plate}
                </strong>
                <small>{m.label} · consentement relance non enregistré</small>
              </span>
            </button>
          ))}
        </article>
      </div>
      <section className="content-card">
        <h3>Activité récente</h3>
        <div className="audit-list">
          {db.audit.slice(0, 20).map((a) => (
            <div key={a.id}>
              <CheckCircle size={18} />
              <span>
                {a.action}
                <small>
                  {db.vehicles.find((v) => v.id === a.vehicle)?.plate ||
                    "Atelier"}
                </small>
              </span>
              <time>{new Date(a.at).toLocaleString("fr-FR")}</time>
            </div>
          ))}
          {!db.audit.length && (
            <p className="empty">
              Les actions effectuées dans le CRM apparaîtront ici.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}

````

## src/Planning.tsx

````tsx
import { useState } from "react";
import {
  CalendarDots,
  Clock,
  ArrowUpRight,
  WarningCircle,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  toCalendarInput,
  fromCalendarInput,
  team,
  resources,
  departments,
  planningAlerts,
  nextAvailable,
  moveAppointment,
  endAt,
  type Appointment,
} from "./planning-domain";
import { type DB } from "./domain";
const time = (s: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(s));
export function Planning({
  db,
  commit,
  onOpen,
}: {
  db: DB;
  commit: (fn: (db: DB) => DB, message?: string) => unknown;
  onOpen: (id: string) => void;
}) {
  const [view, setView] = useState("technicians"),
    [date, setDate] = useState(new Date().toISOString().slice(0, 10)),
    [lateOnly, setLate] = useState(false),
    [editing, setEditing] = useState<string | null>(null),
    [start, setStart] = useState(""),
    [duration, setDuration] = useState(60);
  const alerts = planningAlerts(db),
    appointments = (db.appointments || []).filter(
      (a) =>
        a.start.slice(0, 10) === date &&
        (!lateOnly ||
          alerts.some((x) => x.appointment === a.id && x.code === "late")),
    );
  const lanes =
    view === "technicians"
      ? team.map((t) => ({ id: t.name, name: t.name, detail: t.specialty }))
      : view === "resources"
        ? resources.map((r) => ({
            id: r.id,
            name: r.name,
            detail: r.department,
          }))
        : departments.map((d) => ({
            id: d,
            name: d,
            detail: "Charge du département",
          }));
  const selected = db.appointments?.find((a) => a.id === editing);
  const getLane = (a: Appointment) =>
    view === "technicians"
      ? a.technician
      : view === "resources"
        ? a.resource
        : a.department;
  function drop(id: string, lane: string) {
    const a = db.appointments?.find((a) => a.id === id);
    if (!a) return;
    if (view === "departments") return;
    commit(
      (d) =>
        moveAppointment(
          d,
          id,
          view === "technicians" ? { technician: lane } : { resource: lane },
        ),
      "Réaffectation enregistrée.",
    );
  }
  return (
    <section className="planning-v2">
      <div className="section-head">
        <div>
          <span className="eyebrow">
            RESSOURCES RÉELLES · HORAIRES LISBONNE
          </span>
          <h2>Le rythme de votre atelier.</h2>
        </div>
        <div className="planning-controls">
          <input
            aria-label="Date du planning"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <label className="check-label">
            <input
              type="checkbox"
              checked={lateOnly}
              onChange={(e) => setLate(e.target.checked)}
            />
            Retards
          </label>
        </div>
      </div>
      <div className="planning-tabs">
        {[
          ["technicians", "Par technicien"],
          ["resources", "Par ressource"],
          ["departments", "Par département"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={view === id ? "on" : ""}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="planning-help">
        Glissez une carte vers une autre ligne, ou utilisez Modifier. Les
        conflits et compétences sont contrôlés avant enregistrement.
      </p>
      <div className="schedule-board">
        {lanes.map((lane) => {
          const jobs = appointments.filter((a) => getLane(a) === lane.id);
          const minutes = jobs
            .filter((a) => a.state !== "Terminé")
            .reduce((n, a) => n + a.duration, 0);
          return (
            <div
              className="schedule-lane"
              key={lane.id}
              onDragOver={(e) => {
                if (view !== "departments") e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(e.dataTransfer.getData("text/plain"), lane.id);
              }}
            >
              <div className="lane-person">
                <strong>{lane.name}</strong>
                <small>{lane.detail}</small>
                <span>{Math.round((minutes / 60) * 10) / 10} h planifiées</span>
              </div>
              <div className="lane-jobs">
                {jobs.map((a) => {
                  const v = db.vehicles.find((v) => v.id === a.vehicle)!;
                  const flags = alerts.filter((x) => x.appointment === a.id);
                  return (
                    <article
                      draggable={
                        a.state !== "Terminé" && view !== "departments"
                      }
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", a.id)
                      }
                      className={
                        "schedule-card " +
                        (a.state === "Terminé"
                          ? "complete"
                          : flags.some((f) => f.blocking)
                            ? "blocked"
                            : "")
                      }
                      key={a.id}
                    >
                      <div>
                        <span>
                          {time(a.start)} — {time(endAt(a))}
                        </span>
                        <span>
                          {a.priority === "Haute" ? "Priorité haute" : a.state}
                        </span>
                      </div>
                      <h3>
                        {v.make} {v.model}
                      </h3>
                      <small>
                        {v.plate} · {v.symptoms}
                      </small>
                      <div className="schedule-meta">
                        <Clock size={14} />
                        {a.duration} min · {v.status}
                      </div>
                      <div className="schedule-actions">
                        <button onClick={() => onOpen(v.id)}>
                          <ArrowUpRight size={15} />
                          Dossier / 3D
                        </button>
                        <button
                          disabled={a.state === "Terminé"}
                          onClick={() => {
                            setEditing(a.id);
                            setStart(toCalendarInput(a.start));
                            setDuration(a.duration);
                          }}
                        >
                          Modifier
                        </button>
                      </div>
                      {flags.length > 0 && (
                        <p className="schedule-warning">
                          <WarningCircle size={14} />
                          {flags[0].message}
                          {flags.length > 1
                            ? " + " + (flags.length - 1) + " alertes"
                            : ""}
                        </p>
                      )}
                    </article>
                  );
                })}
                {!jobs.length && (
                  <div className="lane-free">
                    <CheckCircle size={17} />
                    Aucune réservation ce jour
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="planning-editor content-card">
          <div className="section-head">
            <h3>
              Modifier la réservation ·{" "}
              {db.vehicles.find((v) => v.id === selected.vehicle)?.plate}
            </h3>
            <button className="secondary" onClick={() => setEditing(null)}>
              Fermer
            </button>
          </div>
          <div className="form-grid">
            <label>
              Début · heure de Lisbonne
              <input
                aria-label="Début de réservation"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Durée (minutes)
              <input
                aria-label="Durée de réservation"
                type="number"
                min="15"
                max="600"
                step="15"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>
            <label>
              Technicien
              <select
                value={selected.technician}
                onChange={(e) =>
                  commit(
                    (d) =>
                      moveAppointment(d, selected.id, {
                        technician: e.target.value,
                      }),
                    "Technicien réaffecté.",
                  )
                }
              >
                {team.map((t) => (
                  <option key={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label>
              Ressource
              <select
                value={selected.resource}
                onChange={(e) =>
                  commit(
                    (d) =>
                      moveAppointment(d, selected.id, {
                        resource: e.target.value,
                      }),
                    "Ressource modifiée.",
                  )
                }
              >
                {resources.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="primary"
            onClick={() =>
              commit(
                (d) =>
                  moveAppointment(d, selected.id, {
                    start: fromCalendarInput(start),
                    duration,
                  }),
                "Horaire enregistré.",
              )
            }
          >
            Enregistrer l’horaire
          </button>
          {nextAvailable(db, { ...selected, duration }) && (
            <div className="subtle-note">
              <Clock />
              <span>
                Premier créneau libre calculé :{" "}
                {new Date(
                  nextAvailable(db, { ...selected, duration })!,
                ).toLocaleString("fr-FR", { timeZone: "Europe/Lisbon" })}
                . Les pièces et l’accord client restent à vérifier.
              </span>
              <button
                className="secondary"
                onClick={() => {
                  const proposed = nextAvailable(db, { ...selected, duration });
                  if (proposed)
                    commit(
                      (d) =>
                        moveAppointment(d, selected.id, {
                          start: proposed,
                          duration,
                        }),
                      "Créneau proposé enregistré.",
                    );
                }}
              >
                Appliquer
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

````

## src/Quotes.tsx

````tsx
import { useState } from "react";
import {
  Plus,
  CheckCircle,
  Printer,
  FileText,
  X,
  ArrowRight,
  Clock,
} from "@phosphor-icons/react";
import { type DB, type Quote, record, updateVehicle } from "./domain";
import { quoteTotals, saveQuote, approveQuote } from "./quote-domain";
const money = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );
export function Quotes({
  db,
  commit,
  initialVehicle,
}: {
  db: DB;
  initialVehicle?: string;
  commit: (fn: (db: DB) => DB, message?: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(
      (db.quotes || [])
        .filter((q) => q.vehicle === initialVehicle)
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0]?.id || null,
    ),
    [draft, setDraft] = useState<Quote | null>(null),
    [vehicle, setVehicle] = useState(
      initialVehicle ||
        db.vehicles.find((v) => v.status === "Devis à valider")?.id ||
        db.vehicles[0]?.id ||
        "",
    );
  const quotes = db.quotes || [];
  const quote = draft || quotes.find((q) => q.id === selected) || null;
  const totals = quote ? quoteTotals(quote) : null;
  const car = db.vehicles.find((v) => v.id === quote?.vehicle);
  function create() {
    const q: Quote = {
      id: crypto.randomUUID(),
      vehicle,
      lines: [],
      vat: 20,
      state: "Brouillon",
      at: new Date().toISOString(),
    };
    setSelected(q.id);
    setDraft(q);
  }
  return (
    <section className="quotes-layout">
      <aside className="content-card quote-list">
        <div className="section-head">
          <h2>Devis de l’atelier</h2>
          <span className="small-chip">
            {quotes.filter((q) => q.state === "À valider").length} en attente
          </span>
        </div>
        <label>
          Véhicule
          <select
            aria-label="Véhicule du devis"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            {db.vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} · {v.plate}
              </option>
            ))}
          </select>
        </label>
        <button className="primary full" disabled={!vehicle} onClick={create}>
          <Plus size={18} />
          Nouveau devis
        </button>
        <h4>Dossiers signalés en attente</h4>
        {db.vehicles
          .filter((v) => v.status === "Devis à valider")
          .map((v) => (
            <button
              key={v.id}
              className="quote-pending"
              onClick={() => {
                setVehicle(v.id);
                const q = quotes.find((q) => q.vehicle === v.id);
                if (q) {
                  setSelected(q.id);
                  setDraft(null);
                }
              }}
            >
              <Clock />
              <span>
                {v.make} {v.model}
                <small>
                  {v.plate} ·{" "}
                  {quotes.some((q) => q.vehicle === v.id)
                    ? "Ouvrir le devis"
                    : "Devis à composer"}
                </small>
              </span>
            </button>
          ))}
        <h4>Devis enregistrés</h4>
        {quotes.map((q) => (
          <button
            key={q.id}
            className={"quote-pending " + (selected === q.id ? "on" : "")}
            onClick={() => {
              setSelected(q.id);
              setDraft(null);
            }}
          >
            <FileText />
            <span>
              {db.vehicles.find((v) => v.id === q.vehicle)?.plate}
              <small>
                {q.state} · {money(quoteTotals(q).total)}
              </small>
            </span>
            <ArrowRight />
          </button>
        ))}
        {!quotes.length && (
          <p className="empty">
            Créez un devis : aucune ligne ni aucun tarif ne sera ajouté
            automatiquement.
          </p>
        )}
      </aside>
      <section className="content-card quote-editor">
        {quote && totals && car ? (
          <>
            <div className="section-head">
              <div>
                <span className="eyebrow">
                  DEVIS LOCAL · {quote.state.toUpperCase()}
                </span>
                <h2>
                  {car.make} {car.model}
                </h2>
                <p>
                  {car.plate} · {car.client}
                </p>
              </div>
              <button className="secondary" onClick={() => window.print()}>
                <Printer size={18} />
                Imprimer
              </button>
            </div>
            <div className="notice">
              Document de démonstration, sans signature électronique ni valeur
              fiscale. Prix et taux saisis manuellement ; aucune donnée
              fournisseur ou constructeur.
            </div>
            <div className="table-scroll">
              <table className="quote-lines">
                <thead>
                  <tr>
                    <th>Opération / pièce</th>
                    <th>Quantité</th>
                    <th>Prix unitaire HT</th>
                    <th>Total HT</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {quote.lines.map((line, i) => (
                    <tr key={line.id}>
                      <td>
                        <input
                          aria-label={"Libellé ligne " + (i + 1)}
                          disabled={quote.state === "Validé"}
                          value={line.label}
                          onChange={(e) =>
                            setDraft({
                              ...quote,
                              lines: quote.lines.map((l) =>
                                l.id === line.id
                                  ? { ...l, label: e.target.value }
                                  : l,
                              ),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={"Quantité ligne " + (i + 1)}
                          type="number"
                          min=".01"
                          step=".01"
                          disabled={quote.state === "Validé"}
                          value={line.quantity}
                          onChange={(e) =>
                            setDraft({
                              ...quote,
                              lines: quote.lines.map((l) =>
                                l.id === line.id
                                  ? { ...l, quantity: Number(e.target.value) }
                                  : l,
                              ),
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={"Prix ligne " + (i + 1)}
                          type="number"
                          min="0"
                          step=".01"
                          disabled={quote.state === "Validé"}
                          value={line.unitPrice}
                          onChange={(e) =>
                            setDraft({
                              ...quote,
                              lines: quote.lines.map((l) =>
                                l.id === line.id
                                  ? { ...l, unitPrice: Number(e.target.value) }
                                  : l,
                              ),
                            })
                          }
                        />
                      </td>
                      <td>{money(line.quantity * line.unitPrice)}</td>
                      <td>
                        <button
                          aria-label={"Supprimer ligne " + (i + 1)}
                          disabled={quote.state === "Validé"}
                          onClick={() =>
                            setDraft({
                              ...quote,
                              lines: quote.lines.filter(
                                (l) => l.id !== line.id,
                              ),
                            })
                          }
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {quote.state !== "Validé" && (
              <button
                className="secondary"
                onClick={() =>
                  setDraft({
                    ...quote,
                    lines: [
                      ...quote.lines,
                      {
                        id: crypto.randomUUID(),
                        label: "",
                        quantity: 1,
                        unitPrice: 0,
                      },
                    ],
                  })
                }
              >
                <Plus size={18} />
                Ajouter une ligne
              </button>
            )}
            <div className="quote-totals">
              <label>
                TVA saisie (%)
                <input
                  aria-label="TVA du devis"
                  type="number"
                  min="0"
                  max="100"
                  step=".1"
                  disabled={quote.state === "Validé"}
                  value={quote.vat}
                  onChange={(e) =>
                    setDraft({ ...quote, vat: Number(e.target.value) })
                  }
                />
              </label>
              <div>
                <span>
                  Total HT<strong>{money(totals.ht)}</strong>
                </span>
                <span>
                  TVA<strong>{money(totals.tax)}</strong>
                </span>
                <span>
                  Total TTC<strong>{money(totals.total)}</strong>
                </span>
              </div>
            </div>
            <div className="quote-actions">
              {quote.state !== "Validé" && (
                <>
                  <button
                    className="secondary"
                    onClick={() =>
                      commit(
                        (d) => saveQuote(d, { ...quote, state: "Brouillon" }),
                        "Brouillon sauvegardé.",
                      )
                    }
                  >
                    Enregistrer le brouillon
                  </button>
                  <button
                    className="primary"
                    disabled={
                      !quote.lines.length ||
                      quote.lines.some(
                        (l) =>
                          !l.label.trim() || l.quantity <= 0 || l.unitPrice < 0,
                      )
                    }
                    onClick={() => {
                      commit((d) => {
                        const next = saveQuote(d, {
                          ...quote,
                          state: "À valider",
                        });
                        return updateVehicle(next, quote.vehicle, {
                          status: "Devis à valider",
                        });
                      }, "Devis soumis à validation.");
                      setDraft(null);
                    }}
                  >
                    Soumettre à validation
                  </button>
                </>
              )}
              {quote.state === "À valider" && !draft && (
                <button
                  className="primary"
                  onClick={() =>
                    commit(
                      (d) => approveQuote(d, quote.id),
                      "Accord client enregistré manuellement.",
                    )
                  }
                >
                  <CheckCircle size={18} />
                  Enregistrer l’accord client
                </button>
              )}
              {quote.state === "Validé" && (
                <span className="text-green">
                  <CheckCircle />
                  Accord saisi manuellement · journalisé
                </span>
              )}
            </div>
            <p className="warning-small">
              Les modifications du formulaire ne sont sauvegardées qu’avec
              Enregistrer ou Soumettre. Aucun message n’est envoyé au client.
            </p>
          </>
        ) : (
          <div className="empty">
            <FileText size={45} />
            <h2>Un devis clair, lié au véhicule.</h2>
            <p>
              Choisissez un véhicule et créez un devis. Ajoutez uniquement les
              opérations et montants que vous connaissez.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

````

## src/ScanPanel.tsx

````tsx
import { useEffect, useRef, useState } from "react";
import {
  Scan,
  FileArrowUp,
  ArrowClockwise,
  CheckCircle,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  extractRegistration,
  validVIN,
  type FieldEvidence,
} from "./identification";
import type { Worker } from "tesseract.js";
export function ScanPanel({
  onApply,
  onClose,
}: {
  onApply: (fields: FieldEvidence[]) => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [raw, setRaw] = useState(""),
    [fields, setFields] = useState<FieldEvidence[]>([]),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState(""),
    [rotation, setRotation] = useState(0),
    [zoom, setZoom] = useState(1);
  const worker = useRef<Worker | null>(null),
    mounted = useRef(true),
    canvas = useRef<HTMLCanvasElement | null>(null),
    source = useRef<FieldEvidence["source"]>("manual");
  useEffect(
    () => () => {
      mounted.current = false;
      worker.current?.terminate();
    },
    [],
  );
  async function load(next: File) {
    if (busy) return;
    setError("");
    setFields([]);
    setRaw("");
    setRotation(0);
    setZoom(1);
    setPreview("");
    setFile(next);
    if (next.size > 15 * 1024 * 1024) {
      setError("Limite de 15 Mo. Utilisez un document plus léger.");
      setFile(null);
      return;
    }
    setBusy(true);
    setProgress("Ouverture du document…");
    try {
      if (
        next.type === "application/pdf" ||
        next.name.toLowerCase().endsWith(".pdf")
      ) {
        const pdfjs = await import("pdfjs-dist");
        const { default: workerURL } =
          await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = workerURL;
        const task = pdfjs.getDocument({
          data: new Uint8Array(await next.arrayBuffer()),
        });
        const pdf = await task.promise;
        if (pdf.numPages > 5) {
          await task.destroy();
          throw Error("Limite de cinq pages par document dans ce prototype.");
        }
        let text = "";
        let first: HTMLCanvasElement | null = null;
        try {
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            let previousY: number | null = null;
            for (const item of content.items) {
              if (!("str" in item)) continue;
              const y = item.transform[5];
              if (previousY !== null && Math.abs(y - previousY) > 3)
                text += "\n";
              text += item.str + " ";
              if (item.hasEOL) text += "\n";
              previousY = y;
            }
            text += "\n";
            if (p === 1) {
              const view = page.getViewport({ scale: 1.8 });
              first = document.createElement("canvas");
              first.width = view.width;
              first.height = view.height;
              await page.render({ canvas: first, viewport: view }).promise;
            }
          }
        } finally {
          await task.destroy();
        }
        canvas.current = first;
        if (first) setPreview(first.toDataURL("image/png"));
        setRaw(text.trim());
        source.current = text.trim().length > 20 ? "pdf_text" : "ocr_local";
        setProgress(
          text.trim().length > 20
            ? "Texte PDF extrait · cliquez sur Analyser."
            : "PDF image · OCR sur la première page uniquement.",
        );
      } else if (
        ["image/png", "image/jpeg", "image/webp"].includes(next.type)
      ) {
        const bitmap = await createImageBitmap(next);
        const c = document.createElement("canvas");
        const ratio = Math.min(1, 2500 / Math.max(bitmap.width, bitmap.height));
        c.width = Math.round(bitmap.width * ratio);
        c.height = Math.round(bitmap.height * ratio);
        c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
        bitmap.close();
        canvas.current = c;
        setPreview(c.toDataURL("image/png"));
        source.current = "ocr_local";
        setProgress("Photo ouverte · cliquez sur Analyser.");
      } else {
        throw Error(
          "Formats pris en charge : PDF, JPG, PNG et WebP. HEIC nécessite une conversion préalable.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function analyze() {
    setError("");
    setBusy(true);
    try {
      let text = raw;
      if (source.current === "ocr_local" && canvas.current) {
        setProgress("Initialisation de l’OCR local…");
        const { createWorker } = await import("tesseract.js");
        if (!worker.current) {
          const initialized = await createWorker("fra", 1, {
            workerPath: "/ocr/worker.min.js",
            corePath: "/ocr",
            langPath: "/ocr",
            workerBlobURL: false,
            cacheMethod: "none",
            logger: (m) => {
              if (mounted.current)
                setProgress(
                  m.status === "recognizing text"
                    ? `Lecture locale · ${Math.round(m.progress * 100)} %`
                    : "Chargement du moteur local…",
                );
            },
          });
          if (!mounted.current) {
            await initialized.terminate();
            return;
          }
          worker.current = initialized;
        }
        const original = canvas.current;
        const c = document.createElement("canvas");
        const swap = rotation % 180 !== 0;
        c.width = swap ? original.height : original.width;
        c.height = swap ? original.width : original.height;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(original, -original.width / 2, -original.height / 2);
        const result = await worker.current.recognize(c);
        if (!mounted.current) return;
        text = result.data.text;
        setRaw(text);
      }
      if (!text.trim())
        throw Error(
          "Aucun texte lisible. Reprenez la photo ou saisissez les champs manuellement.",
        );
      const parsed = extractRegistration(text, source.current);
      setFields(parsed);
      setProgress(
        "Extraction terminée · toutes les valeurs restent à vérifier.",
      );
    } catch (e) {
      setError("Lecture non aboutie : " + (e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const confirmed = fields.filter((f) => f.confirmed && f.value);
  return (
    <section className="scan-panel">
      <div className="section-head">
        <div>
          <span className="eyebrow">AUTOHUB SCAN · LOCAL</span>
          <h3>Lire une carte grise française</h3>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onClose}
        >
          Fermer le scan
        </button>
      </div>
      <div className="subtle-note">
        <ShieldCheck />
        <span>
          Le document reste dans ce navigateur. Aucune copie de l’original n’est
          enregistrée dans le dossier. Le titulaire C.1 ne remplace jamais
          automatiquement le client.
        </span>
      </div>
      <div className="scan-examples">
        <span>Essayer avec des données fictives :</span>
        {[
          [
            "PDF texte fictif",
            "carte-grise-fictive-texte.pdf",
            "application/pdf",
          ],
          [
            "PDF scanné fictif",
            "carte-grise-fictive-scan.pdf",
            "application/pdf",
          ],
          ["Photo fictive", "carte-grise-fictive-photo.png", "image/png"],
        ].map(([label, name, type]) => (
          <button
            type="button"
            className="secondary"
            disabled={busy}
            key={name}
            onClick={async () => {
              try {
                const response = await fetch("/demo/" + name);
                if (!response.ok) throw Error();
                await load(new File([await response.blob()], name, { type }));
              } catch {
                setError(
                  "Exemple indisponible. Choisissez votre propre document.",
                );
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="scan-upload">
        <FileArrowUp size={25} />
        <span>{file?.name || "Choisir un PDF ou une photo"}</span>
        <input
          aria-label="Document à scanner"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) load(f);
          }}
        />
      </label>
      <div className="scan-columns">
        <div>
          <div className="scan-tools">
            <button
              type="button"
              className="secondary"
              disabled={!preview || busy}
              onClick={() => {
                setRotation((rotation + 90) % 360);
                setFields([]);
              }}
            >
              <ArrowClockwise />
              90°
            </button>
            <label>
              Zoom
              <input
                aria-label="Zoom du document"
                type="range"
                min=".5"
                max="2"
                step=".1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="document-preview">
            {preview ? (
              <img
                src={preview}
                style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
                alt="Document original à vérifier"
              />
            ) : (
              <p>Le document original apparaîtra ici.</p>
            )}
          </div>
          <label>
            Texte extrait ou saisi manuellement
            <textarea
              aria-label="Texte du document"
              value={raw}
              disabled={busy}
              onChange={(e) => {
                setRaw(e.target.value);
                source.current = "manual";
                setFields([]);
              }}
              placeholder={"A : AA-123-BB\nD.1 : RENAULT\nD.3 : CLIO\nE : …"}
            />
          </label>
          <button
            type="button"
            className="primary"
            disabled={busy || (!preview && !raw)}
            onClick={analyze}
          >
            <Scan size={18} />
            {busy ? "Traitement local…" : "Analyser le document"}
          </button>
          <p className="scan-progress" role="status">
            {progress}
          </p>
          {error && (
            <p className="warning-small" role="alert">
              <WarningCircle />
              {error}
            </p>
          )}
        </div>
        <div className="scan-fields">
          <h4>Champs proposés · à confirmer</h4>
          <p>
            Seules les lignes portant un code explicite sont proposées. Les
            valeurs absentes restent à compléter. Les coordonnées de zone ne
            sont pas encore calculées.
          </p>
          {fields.map((f, i) => (
            <div
              className={"scan-field " + (f.confirmed ? "confirmed" : "")}
              key={f.code}
            >
              <label>
                {f.code} · {f.label}
                <input
                  aria-label={"Champ " + f.code}
                  value={f.value}
                  placeholder="À compléter"
                  onChange={(e) =>
                    setFields(
                      fields.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              value: e.target.value,
                              confirmed: false,
                              corrected: true,
                              reviewedAt: null,
                            }
                          : x,
                      ),
                    )
                  }
                />
              </label>
              {f.raw && <small>Lu : {f.raw}</small>}
              <label className="check-label">
                <input
                  aria-label={"Confirmer " + f.code}
                  type="checkbox"
                  checked={f.confirmed}
                  disabled={!f.value || (f.code === "E" && !validVIN(f.value))}
                  onChange={(e) =>
                    setFields(
                      fields.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              confirmed: e.target.checked,
                              reviewedAt: e.target.checked
                                ? new Date().toISOString()
                                : null,
                            }
                          : x,
                      ),
                    )
                  }
                />
                Vérifié sur le document
              </label>
            </div>
          ))}
          {!fields.length && (
            <p className="empty">
              Analysez le document pour proposer des champs.
            </p>
          )}
          <button
            type="button"
            className="primary full"
            disabled={!confirmed.length || busy}
            onClick={() => onApply(confirmed)}
          >
            <CheckCircle size={18} />
            Appliquer {confirmed.length} champs confirmés
          </button>
          <p className="warning-small">
            Prototype français uniquement. La motorisation, la finition et les
            références de pièces ne sont pas déduites.
          </p>
        </div>
      </div>
    </section>
  );
}

````

## src/Stocks.tsx

````tsx
import { useState } from "react";
import {
  MagnifyingGlass,
  Package,
  Plus,
  WarningCircle,
} from "@phosphor-icons/react";
import { record, type DB } from "./domain";
const money = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );
export function Stocks({
  db,
  commit,
}: {
  db: DB;
  commit: (fn: (d: DB) => DB, message?: string) => unknown;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [critical, setCritical] = useState(false);
  const parts = db.parts.filter(
    (p) =>
      (p.name + " " + p.ref + " " + p.location)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (category === "all" || p.category === category) &&
      (!critical || p.stock - p.reserved < p.threshold),
  );
  const categories = [...new Set(db.parts.map((p) => p.category || "Autres"))];
  return (
    <section className="content-card stocks-v2">
      <div className="section-head">
        <div>
          <h2>Magasin & stocks · {db.parts.length} références</h2>
          <p>
            Références internes, fournisseurs et tarifs fictifs. Aucune
            compatibilité OEM présumée.
          </p>
        </div>
        <span className="small-chip">
          Mouvements liés aux dossiers et commandes
        </span>
      </div>
      <div className="stock-filters">
        <div className="search">
          <MagnifyingGlass size={18} />
          <input
            aria-label="Rechercher une pièce"
            placeholder="Désignation, référence, emplacement…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Catégorie de stock"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="check-label">
          <input
            type="checkbox"
            checked={critical}
            onChange={(e) => setCritical(e.target.checked)}
          />
          Stock critique
        </label>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Pièce / référence</th>
              <th>Catégorie / fournisseur</th>
              <th>Emplacement</th>
              <th>Quantité</th>
              <th>Réservées</th>
              <th>Disponibles</th>
              <th>Achat / vente HT démo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <small>
                    {p.ref} · {p.brand}
                  </small>
                </td>
                <td>
                  {p.category}
                  <small>{p.supplier}</small>
                </td>
                <td>
                  {p.location}
                  <small>
                    Dernier mouvement :{" "}
                    {p.lastMovement
                      ? new Date(p.lastMovement).toLocaleDateString("fr-FR")
                      : "—"}
                  </small>
                </td>
                <td>
                  {p.stock}
                  <small>{p.unit || "unité"}</small>
                </td>
                <td>{p.reserved}</td>
                <td>
                  <span
                    className={
                      p.stock - p.reserved < p.threshold
                        ? "text-amber"
                        : "text-green"
                    }
                  >
                    {p.stock - p.reserved}
                  </span>
                  <small>Seuil : {p.threshold}</small>
                </td>
                <td>
                  {money(p.purchasePrice || 0)}
                  <small>{money(p.price)} vente</small>
                </td>
                <td>
                  <button
                    className="secondary"
                    onClick={() =>
                      commit(
                        (d) =>
                          record(
                            {
                              ...d,
                              orders: [
                                {
                                  id: crypto.randomUUID(),
                                  part: p.id,
                                  quantity: 1,
                                  status: "À valider",
                                  at: new Date().toISOString(),
                                },
                                ...d.orders,
                              ],
                            },
                            "stock",
                            "Commande fournisseur préparée, aucun envoi : " +
                              p.name,
                          ),
                        "Commande préparée, sans achat ni envoi.",
                      )
                    }
                  >
                    Préparer
                    <Plus size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!parts.length && (
        <p className="empty">Aucune référence correspondante.</p>
      )}
      <h3>Commandes préparées · aucun fournisseur connecté</h3>
      {db.orders.map((o) => (
        <div className="order-row" key={o.id}>
          <Package />
          <strong>{db.parts.find((p) => p.id === o.part)?.name}</strong>
          <span>
            {o.quantity} unité(s) · {o.status}
          </span>
          <button
            className="secondary"
            disabled={o.status === "Reçue"}
            onClick={() =>
              commit((d) => {
                const order = d.orders.find((x) => x.id === o.id)!;
                if (order.status === "Reçue")
                  throw Error("Commande déjà reçue.");
                return record(
                  {
                    ...d,
                    orders: d.orders.map((x) =>
                      x.id === o.id ? { ...x, status: "Reçue" } : x,
                    ),
                    parts: d.parts.map((p) =>
                      p.id === o.part
                        ? {
                            ...p,
                            stock: p.stock + order.quantity,
                            lastMovement: new Date().toISOString(),
                          }
                        : p,
                    ),
                    stockMovements: [
                      {
                        id: crypto.randomUUID(),
                        part: order.part,
                        vehicle: "stock",
                        kind: "Réception simulée",
                        quantity: order.quantity,
                        at: new Date().toISOString(),
                      },
                      ...(d.stockMovements || []),
                    ],
                  },
                  "stock",
                  "Réception simulée de commande et mouvement de stock",
                );
              }, "Réception simulée enregistrée.")
            }
          >
            Simuler la réception
          </button>
        </div>
      ))}
      <h3>Derniers mouvements</h3>
      {(db.stockMovements || []).slice(0, 12).map((m) => (
        <div className="order-row" key={m.id}>
          <Package />
          <strong>{db.parts.find((p) => p.id === m.part)?.name}</strong>
          <span>
            {m.kind} · {m.quantity} ·{" "}
            {db.vehicles.find((v) => v.id === m.vehicle)?.plate || "Magasin"}
          </span>
          <small>{new Date(m.at).toLocaleString("fr-FR")}</small>
        </div>
      ))}
    </section>
  );
}

````

## src/Team.tsx

````tsx
import { Car, ArrowRight, Clock, ShieldCheck } from "@phosphor-icons/react";
import { team } from "./planning-domain";
import { dashboard } from "./dashboard-domain";
import { workshopFor, elapsedSeconds } from "./workshop-domain";
import type { DB } from "./domain";
export function Team({ db, onOpen }: { db: DB; onOpen: (id: string) => void }) {
  const live = dashboard(db);
  return (
    <section className="content-card">
      <div className="section-head">
        <h2>Huit métiers, une équipe.</h2>
        <span className="small-chip">
          {team.length} profils fictifs · {live.availableTech.length} sans
          session active
        </span>
      </div>
      <div className="team-v2">
        {team.map((t) => {
          const jobs = live.present.filter((v) => v.technician === t.name);
          const active = jobs.filter(
            (v) => !!workshopFor(db, v.id).runningSince,
          );
          const minutes = (db.appointments || [])
            .filter((a) => a.technician === t.name && a.state !== "Terminé")
            .reduce((s, a) => s + a.duration, 0);
          const seconds = db.vehicles
            .filter((v) => v.technician === t.name)
            .reduce((s, v) => s + elapsedSeconds(workshopFor(db, v.id)), 0);
          return (
            <article className="team-profile" key={t.id}>
              <div className="team-profile-top">
                <span style={{ background: t.color }}>
                  {t.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h3>{t.name}</h3>
                  <p>{t.specialty}</p>
                </div>
                <i className={active.length ? "working" : ""} />
              </div>
              <div className="team-skills">
                {t.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <div className="team-numbers">
                <div>
                  <strong>{jobs.length}</strong>
                  <small>Dossiers présents</small>
                </div>
                <div>
                  <strong>{Math.round((minutes / 60) * 10) / 10} h</strong>
                  <small>Charge réservée</small>
                </div>
                <div>
                  <strong>{Math.floor(seconds / 60)} min</strong>
                  <small>Travail chronométré</small>
                </div>
              </div>
              <div className="team-quality">
                <ShieldCheck size={17} />
                {
                  db.vehicles.filter(
                    (v) => v.technician === t.name && v.quality,
                  ).length
                }{" "}
                contrôles documentés ·{" "}
                {
                  (db.diagnosticCases || []).filter(
                    (c) =>
                      c.recurred &&
                      db.vehicles.find((v) => v.id === c.vehicleId)
                        ?.technician === t.name,
                  ).length
                }{" "}
                retour(s) fictif(s)
              </div>
              {jobs.map((v) => (
                <button
                  className="team-task"
                  key={v.id}
                  onClick={() => onOpen(v.id)}
                >
                  <Car size={20} />
                  <span>
                    {v.make} {v.model}
                    <small>
                      {v.plate} · {v.status}
                      {workshopFor(db, v.id).blocked ? " · Bloqué" : ""}
                    </small>
                  </span>
                  <ArrowRight />
                </button>
              ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}

````

## src/VoiceAssistant.tsx

````tsx
import { useEffect, useRef, useState } from "react";
import {
  Microphone,
  Stop,
  CheckCircle,
  SpeakerHigh,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { proposeVoice, type VoiceProposal } from "./voice-domain";
import type { DB } from "./domain";
export function VoiceAssistant({
  db,
  vehicle,
  mode,
  onAction,
  onClose,
}: {
  db: DB;
  vehicle: string;
  mode: string;
  onAction: (type: string, payload: any) => Promise<boolean>;
  onClose: () => void;
}) {
  const [text, setText] = useState(""),
    [proposal, setProposal] = useState<VoiceProposal | null>(null),
    [recording, setRecording] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    stopper = useRef<ReturnType<typeof setTimeout> | null>(null),
    mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
      if (stopper.current) clearTimeout(stopper.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      speechSynthesis?.cancel();
    },
    [],
  );
  async function record() {
    setError("");
    if (recording) {
      if (recorder.current?.state === "recording") recorder.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "Microphone indisponible dans ce navigateur. Utilisez le texte ci-dessous.",
      );
      return;
    }
    try {
      const response = await fetch("/api/speech/capabilities");
      const capabilities = await response.json();
      if (!capabilities.available) {
        setError(
          "Reconnaissance locale non installée. Lancez npm run speech:setup dans AutoHub, ou utilisez le texte. Aucun service externe ne sera utilisé.",
        );
        return;
      }
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream.current);
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = async () => {
        stream.current?.getTracks().forEach((t) => t.stop());
        if (stopper.current) clearTimeout(stopper.current);
        if (!mounted.current) return;
        setRecording(false);
        setBusy(true);
        try {
          const result = await fetch("/api/speech/transcribe", {
            method: "POST",
            headers: { "Content-Type": r.mimeType || "audio/webm" },
            body: new Blob(chunks, { type: r.mimeType }),
          });
          const value = await result.json();
          if (!result.ok) throw Error(value.error);
          if (!mounted.current) return;
          setText(value.text);
          setProposal(proposeVoice(db, vehicle, value.text, mode));
        } catch (e) {
          if (mounted.current) setError((e as Error).message);
        } finally {
          if (mounted.current) setBusy(false);
        }
      };
      r.start();
      setRecording(true);
      stopper.current = setTimeout(() => {
        if (r.state === "recording") r.stop();
      }, 30000);
    } catch (e) {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError("Microphone non accessible : " + (e as Error).message);
    }
  }
  function analyze() {
    try {
      setError("");
      setProposal(proposeVoice(db, vehicle, text, mode));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="voice-assistant content-card">
      <div className="section-head">
        <div>
          <span className="eyebrow">
            ASSISTANT VOCAL · {db.vehicles.find((v) => v.id === vehicle)?.plate}
          </span>
          <h2>
            {mode === "issue"
              ? "Que se passe-t-il ?"
              : mode === "piece"
                ? "Quelle pièce vous manque ?"
                : "Je vous écoute."}
          </h2>
        </div>
        <button
          className="secondary"
          disabled={recording || busy}
          onClick={onClose}
        >
          <X />
          Fermer
        </button>
      </div>
      <button
        className={"microphone-button " + (recording ? "recording" : "")}
        disabled={busy}
        onClick={record}
      >
        {recording ? <Stop size={35} /> : <Microphone size={35} />}
        <strong>
          {recording
            ? "Arrêter et transcrire"
            : busy
              ? "Transcription locale…"
              : "Parler à AutoHub"}
        </strong>
        <span>30 secondes maximum · audio traité sur ce Mac puis supprimé</span>
      </button>
      <label>
        Commande ou compte rendu
        <textarea
          aria-label="Commande vocale transcrite"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setProposal(null);
          }}
          maxLength={2000}
          placeholder={
            mode === "issue"
              ? "La vis de fixation est cassée, je ne peux pas remonter l’étrier."
              : mode === "piece"
                ? "Il me faut deux disques avant pour la Golf."
                : "Mets l’intervention en pause et préviens le responsable."
          }
        />
      </label>
      <button
        className="secondary"
        disabled={!text.trim() || recording || busy}
        onClick={analyze}
      >
        Comprendre et proposer
      </button>
      {error && (
        <div className="notice" role="alert">
          <WarningCircle />
          {error}
        </div>
      )}
      {proposal && (
        <div className="voice-proposal">
          <h3>À confirmer sur ce dossier</h3>
          <p>{proposal.reply}</p>
          {proposal.actions.map((a, i) => (
            <div className="proposed-action" key={i}>
              <CheckCircle size={19} />
              {a.label}
            </div>
          ))}
          {proposal.warnings.map((w) => (
            <p className="warning-small" key={w}>
              {w}
            </p>
          ))}
          <div className="voice-confirm">
            <button
              className="secondary"
              onClick={() => {
                if ("speechSynthesis" in window) {
                  speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(
                    proposal.reply,
                  );
                  const localVoice = speechSynthesis
                    .getVoices()
                    .find((v) => v.localService && v.lang.startsWith("fr"));
                  if (!localVoice) {
                    setError(
                      "Aucune voix française locale disponible : lisez le résumé à l’écran.",
                    );
                    return;
                  }
                  utterance.voice = localVoice;
                  utterance.lang = "fr-FR";
                  speechSynthesis.speak(utterance);
                }
              }}
            >
              <SpeakerHigh size={20} />
              Lire le résumé
            </button>
            <button
              className="primary"
              disabled={proposal.conflict || !proposal.actions.length || busy}
              onClick={async () => {
                setBusy(true);
                const done = await onAction("voice", {
                  text: proposal.text,
                  mode,
                  confirmed: true,
                });
                setBusy(false);
                if (done) {
                  setProposal(null);
                  setText("");
                  onClose();
                }
              }}
            >
              <CheckCircle size={23} />
              Confirmer ces actions
            </button>
          </div>
          <p className="warning-small">
            Aucune commande fournisseur payante. Les références fictives et la
            compatibilité seront vérifiées par le responsable.
          </p>
        </div>
      )}
    </section>
  );
}

````

## src/Workshop.tsx

````tsx
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { VoiceAssistant } from "./VoiceAssistant";
import { serverNow } from "./api";
import {
  Play,
  Pause,
  Package,
  WarningCircle,
  Camera,
  NotePencil,
  CheckCircle,
  QrCode,
  ArrowRight,
  Car,
  Clock,
  Key,
  ArrowLeft,
} from "@phosphor-icons/react";
import { type DB, type Vehicle } from "./domain";
import {
  workshopFor,
  elapsedSeconds,
  toggleWork,
  finishWork,
  patchWorkshop,
  requestPart,
} from "./workshop-domain";
type Commit = (fn: (db: DB) => DB, message?: string) => void;
export function Workshop({
  db,
  selected,
  onSelect,
  commit,
  onOpen3D,
  onAction,
}: {
  db: DB;
  selected: string | null;
  onSelect: (id: string) => void;
  commit: Commit;
  onOpen3D: (id: string) => void;
  onAction: (type: string, payload: any) => Promise<boolean>;
}) {
  const car = db.vehicles.find((v) => v.id === selected);
  const state = car ? workshopFor(db, car.id) : null;
  const [action, setAction] = useState(""),
    [text, setText] = useState(""),
    [qr, setQR] = useState(""),
    [now, setNow] = useState(serverNow()),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    setAction("");
    setText("");
    setQR("");
    setError("");
  }, [selected]);
  async function showQR(v: Vehicle) {
    setQR(
      await QRCode.toDataURL(
        `${location.origin}${location.pathname}#ordre=${encodeURIComponent(v.id)}`,
        { width: 240, margin: 2, errorCorrectionLevel: "M" },
      ),
    );
  }
  async function photo(file: File, v: Vehicle) {
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choisissez une photo JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Photo trop lourde : limite 15 Mo.");
      return;
    }
    if (workshopFor(db, v.id).photos.length >= 3) {
      setError("Trois photos maximum par dossier dans ce prototype local.");
      return;
    }
    setUploading(true);
    try {
      const image = await createImageBitmap(file);
      const c = document.createElement("canvas");
      const ratio = Math.min(1, 900 / Math.max(image.width, image.height));
      c.width = Math.round(image.width * ratio);
      c.height = Math.round(image.height * ratio);
      c.getContext("2d")!.drawImage(image, 0, 0, c.width, c.height);
      image.close();
      const data = c.toDataURL("image/jpeg", 0.7);
      commit(
        (d) =>
          patchWorkshop(
            d,
            v.id,
            {
              photos: [
                ...workshopFor(d, v.id).photos,
                { id: crypto.randomUUID(), data, at: new Date().toISOString() },
              ],
            },
            "Photo atelier ajoutée, original et métadonnées non conservés",
          ),
        "Photo ajoutée au dossier local.",
      );
    } catch {
      setError("La photo n’a pas pu être lue.");
    } finally {
      setUploading(false);
    }
  }
  if (!car || !state)
    return (
      <section className="content-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">MODE TECHNICIEN · 2D</span>
            <h2>Quel véhicule prenez-vous en charge ?</h2>
          </div>
          <span className="small-chip">
            Grandes commandes · sans 3D obligatoire
          </span>
        </div>
        <div className="workshop-picker">
          {db.vehicles
            .filter((v) => v.status !== "Livré")
            .map((v) => (
              <button key={v.id} onClick={() => onSelect(v.id)}>
                <Car size={32} />
                <div>
                  <strong>
                    {v.make} {v.model}
                  </strong>
                  <span>{v.plate}</span>
                  <small>
                    {v.technician} · {v.status}
                  </small>
                </div>
                <ArrowRight size={24} />
              </button>
            ))}
        </div>
      </section>
    );
  const seconds = elapsedSeconds(state, now);
  const time = `${Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0")}:${Math.floor((seconds / 60) % 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  return (
    <section className="workshop-screen">
      <div className="workshop-top">
        <button className="secondary" onClick={() => onSelect("")}>
          <ArrowLeft />
          Autre véhicule
        </button>
        <div>
          <h2>
            {car.make} {car.model}
          </h2>
          <span className="plate">{car.plate}</span>
          <span>{car.status}</span>
        </div>
        <button className="secondary" onClick={() => showQR(car)}>
          <QrCode size={21} />
          QR dossier
        </button>
      </div>
      <div className="workshop-summary">
        <span>
          <Clock size={22} />
          <strong>{time}</strong>
          {state.runningSince ? "En cours" : "En pause"}
        </span>
        <span>
          <Key size={22} />
          {state.keyLocation}
        </span>
        <span>{car.technician}</span>
      </div>
      <div className="workshop-job">
        <strong>Travail demandé</strong>
        <p>{car.symptoms}</p>
        <span>
          {car.estimatedMinutes || 60} min prévues ·{" "}
          {state.blocked ? "Intervention bloquée" : car.status} · Temps de pause
          :{" "}
          {Math.floor(
            ((state.idleElapsed || 0) +
              (state.pausedSince
                ? Math.max(
                    0,
                    Math.floor((now - Date.parse(state.pausedSince)) / 1000),
                  )
                : 0)) /
              60,
          )}{" "}
          min
        </span>
      </div>
      <div className="workshop-actions">
        <button
          className={
            state.runningSince ? "work-action pause" : "work-action start"
          }
          onClick={() =>
            state.runningSince ? setAction("pause") : onAction("start", {})
          }
          disabled={[
            "Prêt à livrer",
            "Livré",
            "Contrôle qualité",
            "Devis à valider",
          ].includes(car.status)}
        >
          {state.runningSince ? <Pause size={34} /> : <Play size={34} />}
          <strong>{state.runningSince ? "Mettre en pause" : "Démarrer"}</strong>
          <span>Chronométrer l’intervention</span>
        </button>
        <button
          className="work-action"
          onClick={() => setAction(action === "piece" ? "" : "piece")}
        >
          <Package size={34} />
          <strong>Demander une pièce</strong>
          <span>Stock et réservations</span>
        </button>
        <button
          className="work-action"
          onClick={() => {
            setAction(action === "issue" ? "" : "issue");
            setText("");
          }}
        >
          <WarningCircle size={34} />
          <strong>Signaler un problème</strong>
          <span>Tracer un blocage</span>
        </button>
        <label className="work-action photo-action">
          <Camera size={34} />
          <strong>{uploading ? "Ajout en cours…" : "Ajouter une photo"}</strong>
          <span>Trois photos locales maximum</span>
          <input
            aria-label="Ajouter une photo atelier"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) photo(f, car);
              e.target.value = "";
            }}
          />
        </label>
        <button
          className="work-action"
          onClick={() => {
            setAction(action === "report" ? "" : "report");
            setText("");
          }}
        >
          <NotePencil size={34} />
          <strong>Dicter un compte rendu</strong>
          <span>Voix locale ou saisie courte</span>
        </button>
        <button
          className="work-action finish"
          onClick={() => onAction("finish", {})}
          disabled={car.status !== "En intervention"}
        >
          <CheckCircle size={34} />
          <strong>Terminer les travaux</strong>
          <span>Après les trois contrôles</span>
        </button>
      </div>
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {["piece", "issue", "report"].includes(action) && (
        <VoiceAssistant
          db={db}
          vehicle={car.id}
          mode={action}
          onAction={onAction}
          onClose={() => setAction("")}
        />
      )}
      {action === "pause" && (
        <div className="content-card pause-choices">
          <h3>Motif de pause</h3>
          {["Pause manuelle", "Attente de pièce", "Attente de décision"].map(
            (reason) => (
              <button
                className="secondary"
                key={reason}
                onClick={async () => {
                  if (await onAction("pause", { reason })) setAction("");
                }}
              >
                {reason}
              </button>
            ),
          )}
        </div>
      )}
      {action === "piece" && (
        <div className="content-card">
          <h3>Sélection manuelle de pièce</h3>
          <div className="part-request-grid">
            {db.parts.map((p) => (
              <button
                className="secondary"
                key={p.id}
                disabled={state.requests.some((r) => r.part === p.id)}
                onClick={() => onAction("request", { part: p.id, quantity: 1 })}
              >
                <strong>{p.name}</strong>
                <span>
                  {p.stock - p.reserved} disponibles · {p.ref}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="workshop-detail">
        <div className="content-card">
          <h3>Checklist de fin de travaux</h3>
          {(
            [
              ["repair", "Les opérations prévues sont réalisées"],
              ["safety", "Les contrôles de sécurité ont été effectués"],
              ["test", "Les tests après réparation sont consignés"],
            ] as const
          ).map(([key, label]) => (
            <label className="check-label" key={key}>
              <input
                type="checkbox"
                checked={state.checks[key]}
                onChange={(e) =>
                  commit((d) =>
                    patchWorkshop(
                      d,
                      car.id,
                      {
                        checks: {
                          ...workshopFor(d, car.id).checks,
                          [key]: e.target.checked,
                        },
                      },
                      "Checklist : " + label,
                    ),
                  )
                }
              />
              {label}
            </label>
          ))}
          <label>
            Emplacement des clés
            <input
              aria-label="Emplacement des clés"
              key={car.id}
              defaultValue={state.keyLocation}
              onBlur={(e) => {
                if (e.target.value !== state.keyLocation)
                  commit((d) =>
                    patchWorkshop(
                      d,
                      car.id,
                      { keyLocation: e.target.value },
                      "Emplacement des clés mis à jour",
                    ),
                  );
              }}
            />
          </label>
          <p className="warning-small">
            La checklist prépare le contrôle final ; elle ne valide pas
            automatiquement la qualité. Le chronomètre continue jusqu’à Pause,
            même si l’onglet est fermé.
          </p>
          <button className="secondary full" onClick={() => onOpen3D(car.id)}>
            Ouvrir le dossier et la vue 3D
            <ArrowRight />
          </button>
        </div>
        <div className="content-card">
          <h3>Suivi du dossier</h3>
          {state.requests.map((r) => (
            <div className="workshop-log" key={r.id}>
              <Package />
              <span>
                <strong>{db.parts.find((p) => p.id === r.part)?.name}</strong>
                <small>{r.state}</small>
              </span>
            </div>
          ))}
          {state.issues.map((i) => (
            <div className="workshop-log issue" key={i.id}>
              <WarningCircle />
              <span>
                {i.text}
                <small>{new Date(i.at).toLocaleString("fr-FR")}</small>
              </span>
            </div>
          ))}
          {state.reports.map((r) => (
            <div className="workshop-log" key={r.id}>
              <NotePencil />
              <span>
                {r.text}
                <small>{new Date(r.at).toLocaleString("fr-FR")}</small>
              </span>
            </div>
          ))}
          <div className="workshop-photos">
            {state.photos.map((p) => (
              <img
                key={p.id}
                src={p.data}
                alt={
                  "Photo atelier du " +
                  new Date(p.at).toLocaleDateString("fr-FR")
                }
              />
            ))}
          </div>
          {!state.requests.length &&
            !state.issues.length &&
            !state.reports.length &&
            !state.photos.length && (
              <p className="empty">
                Les demandes, problèmes, comptes rendus et photos apparaîtront
                ici.
              </p>
            )}
        </div>
      </div>
      {qr && (
        <div className="qr-panel">
          <div>
            <h3>QR de l’ordre de réparation</h3>
            <p>
              Uniquement l’identifiant du dossier, sans client, plaque ou VIN.
              Ce code ne donne aucun droit d’accès.
            </p>
            <p className="warning-small">
              Prototype local : le dossier doit déjà exister dans le navigateur
              qui ouvre le lien. Un téléphone ne peut pas consulter ce serveur
              sur son propre localhost.
            </p>
            <button className="secondary" onClick={() => setQR("")}>
              Masquer le QR
            </button>
          </div>
          <img src={qr} alt="QR code du dossier atelier" />
        </div>
      )}
    </section>
  );
}

````

## src/api.ts

````typescript
import type { DB } from "./domain";
export type Snapshot = { db: DB; revision: number; serverNow: number };
let offset = 0;
export const serverNow = () => Date.now() + offset;
export function syncClock(now: number) {
  offset = now - Date.now();
}
export async function readServer(): Promise<Snapshot> {
  const response = await fetch("/api/state");
  if (!response.ok) throw Error("Serveur AutoHub indisponible.");
  const value = await response.json();
  syncClock(value.serverNow);
  return value;
}
export async function changeServer(
  revision: number,
  type: string,
  vehicle: string | undefined,
  payload: any,
): Promise<Snapshot> {
  const response = await fetch("/api/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      revision,
      type,
      vehicle,
      payload,
      requestId: crypto.randomUUID(),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Modification refusée.");
  syncClock(data.serverNow);
  return data;
}

````

## src/assets.ts

````typescript
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
export const modelNames = [
  "sedan",
  "sedan-sports",
  "suv",
  "suv-luxury",
  "hatchback-sports",
  "van",
  "delivery",
  "delivery-flat",
  "truck",
  "truck-flat",
] as const;
export const modelIds = [
  ...modelNames.map((n) => "kenney-" + n),
  "spectral-gt",
];
export type Asset = {
  id: string;
  kind: "vehicle" | "mechanical";
  name: string;
  make: string;
  source: string;
  creator: string | null;
  license: string;
  licenseStatus: string;
  verifiedAt: string | null;
  licenseProof?: string;
  triangles: number;
  bytes: number;
  sha256: string | null;
  status: string;
  url: string | null;
  preview: string | null;
  generic: boolean;
  enabled: boolean;
  noAI: boolean;
  attribution?: string;
};
const cache = new Map<string, Promise<THREE.Group>>();
export function supportedAsset(id: string) {
  return modelIds.includes(id);
}
export async function loadVehicleAsset(id: string): Promise<THREE.Group> {
  if (!supportedAsset(id)) throw Error("Modèle non vérifié ou inconnu.");
  let request = cache.get(id);
  if (!request) {
    request = new GLTFLoader()
      .loadAsync(
        "/models/" +
          (id === "spectral-gt" ? "spectral-gt" : id.slice(7)) +
          ".glb",
      )
      .then((g) => g.scene);
    cache.set(id, request);
    request.catch(() => cache.delete(id));
  }
  const original = await request;
  const clone = original.clone(true);
  clone.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry = o.geometry.clone();
      o.material = Array.isArray(o.material)
        ? o.material.map((m) => m.clone())
        : o.material.clone();
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const bounds = new THREE.Box3().setFromObject(clone),
    size = bounds.getSize(new THREE.Vector3()),
    center = bounds.getCenter(new THREE.Vector3());
  const scale = 4.1 / Math.max(size.x, size.z);
  clone.scale.setScalar(scale);
  clone.position.set(
    -center.x * scale,
    -bounds.min.y * scale,
    -center.z * scale,
  );
  const group = new THREE.Group();
  group.name = "licensed-glb";
  group.rotation.y = id === "spectral-gt" ? Math.PI / 2 : Math.PI;
  group.add(clone);
  return group;
}
export function disposeObject(group: THREE.Object3D) {
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
        m.dispose(),
      );
    }
  });
}

````

## src/camera-navigation.ts

````typescript
/** Frame cars from the central aisle; the delivery room needs its own viewpoint. */
export function vehicleView(x: number, z: number, aspect = 1, rear = false) {
  const distance = Math.max(7.8, 6.4 / Math.max(aspect, 0.35));
  const side = x < 0 ? 1 : -1;
  const dx = side * distance * 0.66 * (z > 6 && rear ? -1 : 1);
  const dz = distance * 0.75 * (rear || z > 6 ? -1 : 1);
  return {
    position: [x + dx, 3.8, z + dz] as [number, number, number],
    target: [x, 0.95, z] as [number, number, number],
  };
}
/** Hidden fallback geometry and cutaway architecture must never intercept clicks. */
export function isRendered(object: { visible: boolean; parent: any }): boolean {
  let node: { visible: boolean; parent: any } | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
}
export function shortestTurn(current: number, target: number, dt: number) {
  const angle = target - current;
  return (
    current +
    Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-6 * dt))
  );
}

export function zoneView(
  id: string,
  x: number,
  z: number,
  aspect = 1,
  depth = 52,
) {
  const workshop = id === "atelier" || id === "parking";
  if (workshop) z = (-depth - 9) / 2;
  const halfWidth = workshop ? 12 : id === "showroom" ? 12 : 5;
  const halfDepth = workshop ? (depth - 9) / 2 : id === "showroom" ? 5 : 7;
  const distance = Math.max(
    halfDepth * 2.8,
    ((halfWidth + halfDepth * 0.6) * 3.2) / Math.max(aspect, 0.35),
  );
  return {
    position: [x + distance * 0.45, distance * 0.72, z + distance * 0.63] as [
      number,
      number,
      number,
    ],
    target: [x, 0.8, z] as [number, number, number],
  };
}

````

## src/camera-occlusion.ts

````typescript
import * as THREE from "three";
/** Hide architecture crossing the centre or silhouette of the vehicle, not objects behind it. */
export function occludesTarget(
  bounds: THREE.Box3,
  camera: THREE.Vector3,
  aim: THREE.Vector3,
) {
  return [
    [0, 0],
    [-1, -1.9],
    [1, -1.9],
    [-1, 1.9],
    [1, 1.9],
  ].some(([dx, dz]) => {
    const target = aim.clone().add(new THREE.Vector3(dx, 0, dz));
    const direction = target.clone().sub(camera);
    const distance = direction.length();
    const ray = new THREE.Ray(camera, direction.normalize());
    const hit = ray.intersectBox(bounds, new THREE.Vector3());
    return hit !== null && hit.distanceTo(camera) < distance - 1;
  });
}

````

## src/communication-domain.ts

````typescript
import type { DB } from "./domain.ts";

/** Local outbox: preparing a draft never sends a message or records client approval. */
export function prepareClientMessage(
  db: DB,
  vehicleId: string,
  kind: "pickup" | "quote",
): DB {
  const v = db.vehicles.find((v) => v.id === vehicleId);
  if (!v) throw Error("Dossier introuvable.");
  let text: string;
  if (kind === "pickup") {
    if (!v.quality || !["Prêt à livrer", "Livré"].includes(v.status))
      throw Error(
        "Validez le contrôle qualité avant de préparer la restitution.",
      );
    text = `Bonjour ${v.client}, votre ${v.make} ${v.model} (${v.plate}) est prêt à être récupéré. Contactez l’accueil pour convenir de votre passage. L’équipe AutoHub.`;
  } else {
    const q = db.quotes?.find(
      (q) => q.vehicle === v.id && q.state === "À valider",
    );
    if (!q?.lines.length)
      throw Error(
        "Enregistrez un devis avec des lignes et soumettez-le à validation.",
      );
    const ht = q.lines.reduce(
      (n, l) => n + Math.round(l.quantity * l.unitPrice * 100) / 100,
      0,
    );
    const total = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(Math.round((ht + Math.round(ht * q.vat) / 100) * 100) / 100);
    text = `Bonjour ${v.client}, le devis pour votre ${v.make} ${v.model} (${v.plate}) s’élève à ${total} TTC. Travaux proposés : ${q.lines.map((l) => l.label).join(", ")}. Merci de nous confirmer votre accord avant la poursuite des travaux. L’équipe AutoHub.`;
  }
  if (db.messages.some((m) => m.vehicle === v.id && m.text === text)) return db;
  return {
    ...db,
    messages: [
      { id: crypto.randomUUID(), vehicle: v.id, text },
      ...db.messages,
    ],
    audit: [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        vehicle: v.id,
        action: `Agent WhatsApp : brouillon ${kind === "pickup" ? "restitution" : "devis"} préparé, non envoyé`,
      },
      ...db.audit,
    ],
  };
}

````

## src/dashboard-domain.ts

````typescript
import type { DB, Vehicle } from "./domain.ts";
import { team, planningAlerts } from "./planning-domain.ts";
import { workshopFor, elapsedSeconds } from "./workshop-domain.ts";
export type ManagerAlert = {
  id: string;
  vehicle: string;
  kind: string;
  message: string;
  at: string;
  resolved: boolean;
};
export const isPresent = (v: Vehicle) =>
  v.present !== false && v.status !== "Livré";
export function dashboard(db: DB, now = Date.now()) {
  const present = db.vehicles.filter(isPresent);
  const ready = present.filter((v) => v.status === "Prêt à livrer");
  const blocked = present.filter((v) => workshopFor(db, v.id).blocked);
  const running = present.filter((v) => !!workshopFor(db, v.id).runningSince);
  const late = present.filter((v) =>
    (db.appointments || []).some(
      (a) =>
        a.vehicle === v.id &&
        a.state !== "Terminé" &&
        Date.parse(a.start) + a.duration * 60000 < now,
    ),
  );
  const critical = db.parts.filter((p) => p.stock - p.reserved < p.threshold);
  const accepted = (db.quotes || []).filter((q) => q.state === "Validé");
  const pending = (db.quotes || []).filter((q) => q.state === "À valider");
  const availableTech = team.filter(
    (t) => !running.some((v) => v.technician === t.name),
  );
  return {
    present,
    ready,
    blocked,
    running,
    late,
    critical,
    accepted,
    pending,
    availableTech,
    occupied: present.filter((v) => v.bay !== null),
    turnover: (db.invoices || [])
      .filter((i) => i.state === "Payée")
      .reduce((s, i) => s + i.total, 0),
    appointments: (db.appointments || []).filter(
      (a) => a.state === "Planifié" && Date.parse(a.start) > now,
    ),
    alerts: [
      ...(db.alerts || []).filter((a) => !a.resolved),
      ...planningAlerts(db, undefined, now).map((a) => ({
        id: a.appointment + "-" + a.code,
        vehicle: a.vehicle,
        kind: "planning",
        message: a.message,
        at: db.appointments?.find((p) => p.id === a.appointment)?.start || "",
        resolved: false,
      })),
    ],
  };
}

````

## src/dealership-layout.ts

````typescript
export type DealershipLayout = {
  leftBrand: string;
  rightBrand: string;
  waitingRoom: boolean;
  workshopSpacing?: number;
};
export const portoLayout: DealershipLayout = {
  leftBrand: "Jaguar",
  rightBrand: "Land Rover",
  waitingRoom: true,
  workshopSpacing: 5,
};
export function layoutFor(value?: DealershipLayout): DealershipLayout {
  return { ...portoLayout, ...value };
}

````

## src/demo.ts

````typescript
import type { DB, Vehicle, Part, Quote } from "./domain.ts";
import { team, type Appointment, type Department } from "./planning-domain.ts";
import type { DiagnosticCase } from "./diagnostic-domain.ts";
import type { WorkshopState } from "./workshop-domain.ts";
const stockRows = [
  ["disc", "Disque de frein avant", "Freinage", "unité", 78],
  ["pads", "Jeu de plaquettes avant", "Freinage", "jeu", 46],
  ["caliper", "Étrier avant gauche", "Freinage", "unité", 145],
  ["filter", "Filtre à huile", "Filtres", "unité", 12],
  ["air-filter", "Filtre à air", "Filtres", "unité", 22],
  ["cabin-filter", "Filtre d’habitacle", "Filtres", "unité", 19],
  ["fuel-filter", "Filtre à carburant", "Filtres", "unité", 34],
  ["gear-filter", "Filtre à transmission", "Filtres", "unité", 42],
  ["pads-rear", "Plaquettes arrière", "Freinage", "jeu", 41],
  ["disc-rear", "Disques arrière", "Freinage", "unité", 69],
  ["caliper-right", "Étrier avant droit", "Freinage", "unité", 148],
  ["brake-fluid", "Liquide de frein", "Freinage", "litre", 13],
  ["brake-hose", "Flexible de frein", "Freinage", "unité", 29],
  ["abs-sensor", "Capteur ABS", "Freinage", "unité", 54],
  ["wear-sensor", "Témoin d’usure de plaquettes", "Freinage", "unité", 15],
  ["oil-5w30", "Huile moteur 5W-30", "Fluides", "litre", 11],
  ["oil-0w20", "Huile moteur 0W-20", "Fluides", "litre", 13],
  ["oil-5w40", "Huile moteur 5W-40", "Fluides", "litre", 10],
  ["coolant", "Liquide de refroidissement", "Fluides", "litre", 8],
  ["screen-fluid", "Liquide lave-glace", "Fluides", "litre", 4],
  ["gear-oil", "Huile de boîte", "Fluides", "litre", 16],
  ["steering-fluid", "Liquide de direction assistée", "Fluides", "litre", 12],
  ["brake-cleaner", "Nettoyant frein", "Fluides", "aérosol", 7],
  ["tyre-16", "Pneu 205/55 R16", "Pneumatiques", "unité", 83],
  ["tyre-17", "Pneu 225/45 R17", "Pneumatiques", "unité", 109],
  ["tyre-18", "Pneu 225/40 R18", "Pneumatiques", "unité", 132],
  ["valve", "Valve de pneu", "Pneumatiques", "unité", 4],
  ["tpms", "Capteur TPMS", "Pneumatiques", "unité", 56],
  ["weights", "Masse d’équilibrage", "Pneumatiques", "boîte", 18],
  ["battery", "Batterie 12 V", "Électricité", "unité", 139],
  ["alternator", "Alternateur", "Électricité", "unité", 279],
  ["starter", "Démarreur", "Électricité", "unité", 229],
  ["spark", "Bougie d’allumage", "Électricité", "unité", 14],
  ["glow", "Bougie de préchauffage", "Électricité", "unité", 24],
  ["fuse", "Fusible", "Électricité", "unité", 2],
  ["relay", "Relais électrique", "Électricité", "unité", 17],
  ["shock-front", "Amortisseur avant", "Suspension", "unité", 98],
  ["shock-rear", "Amortisseur arrière", "Suspension", "unité", 78],
  ["spring", "Ressort de suspension", "Suspension", "unité", 59],
  ["arm", "Triangle de suspension", "Suspension", "unité", 86],
  ["tie-rod", "Rotule de direction", "Suspension", "unité", 38],
  ["bonnet", "Capot", "Carrosserie", "unité", 310],
  ["bumper", "Pare-chocs avant", "Carrosserie", "unité", 245],
  ["mirror", "Rétroviseur", "Carrosserie", "unité", 165],
  ["headlight", "Phare avant", "Carrosserie", "unité", 289],
  ["rear-light", "Feu arrière", "Carrosserie", "unité", 119],
  ["windscreen", "Pare-brise", "Vitrage", "unité", 295],
  ["wiper", "Balai d’essuie-glace", "Vitrage", "paire", 29],
  ["glass-glue", "Colle à pare-brise", "Vitrage", "cartouche", 23],
  ["belt", "Courroie d’accessoire", "Entretien", "unité", 35],
] as const;
export function demoStock(now: number): Part[] {
  return stockRows.map(([id, name, category, unit, price], i) => ({
    id,
    name,
    category,
    unit,
    price,
    purchasePrice: Math.round(price * 0.62 * 100) / 100,
    brand: "AtelierParts Démo",
    supplier: "Fournisseur fictif " + ((i % 3) + 1),
    ref:
      "DEMO-" +
      category.slice(0, 3).toUpperCase() +
      "-" +
      String(i + 1).padStart(3, "0"),
    stock:
      id === "disc"
        ? 8
        : id === "pads"
          ? 3
          : id === "caliper" || id === "caliper-right" || id === "windscreen"
            ? 0
            : id === "filter"
              ? 24
              : i % 11 === 0
                ? 0
                : i % 7 === 0
                  ? 2
                  : 10 + (i % 18),
    reserved: 0,
    location:
      String.fromCharCode(65 + Math.floor(i / 10)) +
      " · " +
      String((i % 10) + 1).padStart(2, "0"),
    threshold: id === "disc" || id === "pads" ? 4 : 3,
    lastMovement: new Date(now - (i + 1) * 3600000).toISOString(),
    demo: true,
  }));
}
const models: [string, string, Vehicle["shape"]][] = [
  ["BMW", "Série 3", "sedan"],
  ["Peugeot", "3008", "suv"],
  ["Volkswagen", "Golf", "hatch"],
  ["Land Rover", "Range Rover", "suv"],
  ["Renault", "Clio", "hatch"],
  ["Audi", "A4", "sedan"],
  ["Volvo", "XC60", "suv"],
  ["Citroën", "C3", "hatch"],
  ["Toyota", "Yaris", "hatch"],
  ["Audi", "Q5", "suv"],
  ["Peugeot", "208", "hatch"],
  ["Volkswagen", "Tiguan", "suv"],
  ["Mercedes", "Classe C", "sedan"],
  ["Dacia", "Duster", "suv"],
  ["Ford", "Focus", "hatch"],
  ["Opel", "Corsa", "hatch"],
  ["Fiat", "500", "hatch"],
  ["Nissan", "Qashqai", "suv"],
  ["Hyundai", "i30", "hatch"],
  ["Kia", "Ceed", "hatch"],
];
const clients = [
  "Alexandre Dubois",
  "Camille Laurent",
  "Julien Robert",
  "Sophie Mercier",
  "Marc Lefèvre",
  "Nathalie Roux",
  "Pierre Girard",
  "Clara Morel",
  "Hugo Fontaine",
  "Inès Garnier",
  "Sarah Lopes",
  "Louis Mendes",
  "Manon Durand",
  "Adam Pereira",
];
const diagnosticRows = [
  [
    "Démarrage difficile",
    "P0562",
    "Batterie faible",
    "Tension de démarrage mesurée à 8,7 V sur ce cas fictif.",
    "Batterie remplacée après confirmation du défaut.",
  ],
  [
    "Décharge de batterie à l’arrêt",
    "B1318",
    "Consommation parasite",
    "Consommation de repos fictive : 260 mA ; relais isolé lors du test.",
    "Relais concerné remplacé puis consommation contrôlée.",
  ],
  [
    "Voyant batterie, charge insuffisante",
    "P0620",
    "Régulateur d’alternateur",
    "Tension de charge fictive mesurée : 11,9 V.",
    "Alternateur remplacé après contrôle du circuit.",
  ],
  [
    "Voyant ABS intermittent",
    "C0035",
    "Capteur de roue",
    "Signal absent sur la roue avant gauche dans le relevé fictif.",
    "Capteur et connectique contrôlés puis réparation.",
  ],
  [
    "Calage moteur à chaud",
    "P0335",
    "Capteur de vilebrequin",
    "Signal du capteur absent à chaud dans le test fictif.",
    "Capteur remplacé et essai de redémarrage.",
  ],
  [
    "Température moteur élevée",
    "P0217",
    "Thermostat bloqué",
    "Test d’ouverture non effectué ; cause à vérifier.",
    "Aucune réparation confirmée.",
  ],
  [
    "Fuite de liquide de refroidissement",
    "",
    "Durite fissurée",
    "Fuite localisée sous pression dans ce cas fictif.",
    "Durite remplacée et test d’étanchéité final.",
  ],
  [
    "Perte de puissance, turbo",
    "P0299",
    "Fuite de suralimentation",
    "Fuite fictive confirmée sur une durite, pression insuffisante relevée.",
    "Durite remplacée puis contrôle des pressions.",
  ],
  [
    "Ralenti irrégulier, injecteurs",
    "P0202",
    "Circuit injecteur",
    "Mesures électriques à compléter ; injecteur non condamné.",
    "Diagnostic encore ouvert.",
  ],
  [
    "À-coups de boîte automatique",
    "P0741",
    "Verrouillage convertisseur",
    "Mesures et documentation de la variante à vérifier.",
    "Aucun remplacement engagé.",
  ],
  [
    "FAP chargé, mode dégradé",
    "P2463",
    "Accumulation de suie",
    "Pression différentielle fictive trop élevée, valeurs consignées.",
    "Cause d’encrassement corrigée et contrôle final.",
  ],
  [
    "Ralenti instable, EGR",
    "P0401",
    "Passage EGR obstrué",
    "Contrôle fictif du débit et inspection du passage.",
    "Passage remis en état puis contrôle.",
  ],
  [
    "Climatisation sans froid",
    "B10A9",
    "Fuite circuit climatisation",
    "Fuite fictive repérée lors d’un test adapté par un professionnel.",
    "Réparation de la fuite et contrôle réglementaire simulé.",
  ],
  [
    "Bruit de suspension sur bosses",
    "",
    "Silentbloc usé",
    "Jeu fictif observé au contrôle du train avant.",
    "Élément remplacé et essai final.",
  ],
  [
    "Défauts électriques, direction intermittente, démarrage difficile",
    "P0562 U0100",
    "Masse oxydée",
    "Chute de tension fictive sur masse : 1,4 V sous charge.",
    "Liaison réparée et tests électriques répétés.",
  ],
] as const;
export function createDemo(now = Date.now()): DB {
  const baseDay = new Date(now);
  baseDay.setHours(8, 0, 0, 0);
  const start = (offset: number) =>
    new Date(baseDay.getTime() + offset * 60000).toISOString();
  const currentStatuses: Vehicle["status"][] = [
    "En intervention",
    "Diagnostic",
    "Devis à valider",
    "Diagnostic",
    "En intervention",
    "En intervention",
    "Prêt à livrer",
    "Prêt à livrer",
    "Prêt à livrer",
    "Prêt à livrer",
    "Réception",
    "Réception",
    "Devis à valider",
    "Diagnostic",
  ];
  const names = [
    "Yanis",
    "Thomas",
    "Kader",
    "Rayan",
    "Karim",
    "Lucas",
    "Mehdi",
    "Sofiane",
    "Karim",
    "Rayan",
    "Non affecté",
    "Mehdi",
    "Sofiane",
    "Thomas",
  ];
  const vehicles: Vehicle[] = Array.from({ length: 60 }, (_, i) => {
    const [make, model, shape] = models[i % models.length];
    const present = i < 14;
    const status = present
      ? currentStatuses[i]
      : i < 20
        ? "Réception"
        : "Livré";
    return {
      id: "v" + (i + 1),
      make,
      model,
      shape,
      plate:
        i === 0
          ? "GH-482-LP"
          : i === 1
            ? "FV-913-AB"
            : i === 2
              ? "GT-205-NC"
              : `DE-${String(i + 100).padStart(3, "0")}-MO`,
      client:
        clients[i % clients.length] + (i >= 14 ? " · dossier " + (i + 1) : ""),
      phone:
        "06 00 00 " +
        String(Math.floor(i / 100)).padStart(2, "0") +
        " " +
        String(i).padStart(2, "0"),
      email: "",
      country: "FR",
      km: 84500 + i * 1700,
      year: 2018 + (i % 7),
      color: ["#426780", "#b7b9b4", "#b39c79", "#52665b", "#b36e5b", "#d8d8d2"][
        i % 6
      ],
      symptoms:
        i === 0
          ? "Vibrations au freinage et bruit sur le train avant."
          : i === 2
            ? "Remplacement de pare-brise, impact hors champ réparable."
            : i === 13
              ? "Voyant moteur et attente de diagnostic électrique."
              : diagnosticRows[i % 15][0],
      codes:
        i === 0 || i === 2 || (i >= 6 && i < 14)
          ? ""
          : diagnosticRows[i % 15][1],
      status,
      technician: present ? names[i] : team[i % 8].name,
      bay: i < 6 ? i + 1 : null,
      due: present ? "16:30" : "17:00",
      quality: status === "Livré" || status === "Prêt à livrer",
      notes: present
        ? "Dossier de démonstration fictif."
        : "Archive de démonstration fictive.",
      parts: [],
      present,
      ...(present
        ? { arrivedAt: new Date(now - (70 + i * 8) * 60000).toISOString() }
        : {}),
      estimatedMinutes: i === 2 ? 90 : 60 + (i % 3) * 30,
      engine: "Motorisation démo " + ((i % 4) + 1),
      demo: true,
      department:
        i === 2
          ? "Vitrage"
          : i === 1 || i === 3 || i === 13
            ? "Diagnostic"
            : i === 11
              ? "Pneumatiques"
              : i === 12
                ? "Carrosserie"
                : "Mécanique",
    };
  });
  const quotes: Quote[] = Array.from({ length: 7 }, (_, i) => ({
    id: "demo-quote-" + (i + 1),
    vehicle: i < 5 ? ["v1", "v2", "v4", "v5", "v6"][i] : i === 5 ? "v3" : "v13",
    lines: [
      {
        id: "quote-line-" + i,
        label: "Opération et pièces fictives · devis de démonstration",
        quantity: 1,
        unitPrice: 180 + i * 75,
      },
    ],
    vat: 20,
    state: i < 5 ? "Validé" : "À valider",
    at: new Date(now - 86400000).toISOString(),
  }));
  const appointments: Appointment[] = vehicles.slice(0, 20).map((v, i) => ({
    id: "appointment-" + v.id,
    vehicle: v.id,
    technician: v.technician === "Non affecté" ? "Rayan" : v.technician,
    resource:
      i < 6
        ? "lift-" + (i + 1)
        : i < 10
          ? "quality"
          : i === 11
            ? "tyres"
            : i === 12
              ? "body"
              : i === 13
                ? "diagnostic"
                : i >= 14
                  ? "lift-" + ((i % 8) + 1)
                  : "lift-7",
    department: v.department || "Mécanique",
    start:
      i < 6
        ? start(120)
        : i < 10
          ? start(-120 + i * 60)
          : i >= 14
            ? new Date(
                baseDay.getTime() + 86400000 + (i - 14) * 90 * 60000,
              ).toISOString()
            : start(360 + (i - 10) * 90),
    duration: v.estimatedMinutes || 60,
    promised: new Date(
      baseDay.getTime() + (i >= 14 ? 86400000 : 0) + 10 * 3600000,
    ).toISOString(),
    priority: i === 2 || i === 13 ? "Haute" : "Normale",
    requiredParts:
      i === 0
        ? ["disc", "pads"]
        : i === 2
          ? ["windscreen", "glass-glue"]
          : i === 4
            ? ["filter"]
            : i === 11
              ? ["tyre-17"]
              : [],
    requiresQuote: i < 6 || i === 12,
    state:
      i >= 6 && i < 10 ? "Terminé" : i < 6 && i !== 2 ? "En cours" : "Planifié",
    arrived: v.present === true,
  }));
  // Sequential diagnostic bookings; no simultaneous technician reservation in the demo.
  appointments.find((a) => a.vehicle === "v4")!.start = start(240);
  appointments.find((a) => a.vehicle === "v4")!.technician = "Rayan";
  appointments.find((a) => a.vehicle === "v3")!.resource = "glass";
  for (const a of appointments.filter((a) => a.vehicle === "v3"))
    a.start = start(420);
  for (const a of appointments.filter((a) => !a.arrived)) {
    const tech = team.find((t) => t.name === a.technician)!;
    if (!tech.skills.includes(a.department)) {
      a.department = tech.department;
      const dedicated = {
        Vitrage: "glass",
        Pneumatiques: "tyres",
        Diagnostic: "diagnostic",
        Carrosserie: "body",
        Peinture: "paint",
      } as Record<string, string>;
      a.resource = dedicated[a.department] || a.resource;
    }
  }
  for (const v of vehicles) {
    const a = appointments.find((a) => a.vehicle === v.id);
    if (a)
      v.due = new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Europe/Lisbon",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(a.promised));
  }
  const parts = demoStock(now);
  const workshop: Record<string, WorkshopState> = {};
  for (const [i, v] of vehicles.slice(0, 14).entries()) {
    workshop[v.id] = {
      elapsed: i < 6 ? 900 + i * 60 : 0,
      runningSince: null,
      checks: { repair: v.quality, safety: v.quality, test: v.quality },
      keyLocation: "Accueil · casier " + String(i + 1).padStart(2, "0"),
      issues: [],
      photos: [],
      reports: [],
      requests: [],
      idleElapsed: 0,
      pausedSince: null,
      pauseReason: "",
      blocked: false,
      events: [],
    };
  }
  // Running sessions are started by the seed initializer on the server, not by fixtures used in unit tests.
  const diagnosticCases: DiagnosticCase[] = diagnosticRows.map(
    ([symptoms, code, cause, proof, repair], i) => {
      const v = vehicles[20 + i];
      v.symptoms = symptoms;
      v.codes = code;
      const open = [5, 8, 9].includes(i);
      return {
        id: "DIAG-" + String(i + 1).padStart(3, "0"),
        vehicleId: v.id,
        at: new Date(now - (i + 4) * 86400000).toISOString(),
        symptoms,
        codes: code.split(" ").filter(Boolean),
        engine: v.engine!,
        tests: [
          { name: "Contrôle initial consigné", result: proof, done: !open },
          {
            name: "Contrôle après réparation",
            result: open
              ? "Non effectué."
              : "Essai final fictif enregistré, défaut non reproduit.",
            done: !open,
          },
        ],
        hypotheses: [
          { label: cause, state: open ? "À vérifier" : "Confirmée" },
          {
            label: "Autre composant du système",
            state: open ? "À vérifier" : "Rejetée",
          },
        ],
        cause: open ? null : cause,
        repair,
        result: open
          ? "Dossier non résolu ; aucune certitude."
          : "Résolution fictive confirmée dans le dossier.",
        resolved: !open,
        recurred: i === 10,
        demo: true,
      };
    },
  );
  const alerts = [
    {
      id: "demo-alert-v14",
      vehicle: "v14",
      kind: "diagnostic",
      message: "Diagnostic électrique complémentaire demandé.",
      at: new Date(now - 1800000).toISOString(),
      resolved: false,
    },
  ];
  workshop.v14.blocked = true;
  workshop.v14.issues = [
    {
      id: "demo-issue-v14",
      text: "Diagnostic électrique complémentaire à valider.",
      at: new Date(now - 1800000).toISOString(),
      state: "Ouvert",
      category: "Diagnostic",
    },
  ];
  return {
    version: 1,
    demoVersion: 2,
    vehicles,
    parts,
    audit: [],
    orders: [
      {
        id: "demo-order-1",
        part: "windscreen",
        quantity: 1,
        status: "À valider",
      },
      {
        id: "demo-order-2",
        part: "caliper-right",
        quantity: 2,
        status: "À valider",
      },
    ],
    messages: [],
    quotes,
    workshop,
    appointments,
    diagnosticCases,
    alerts,
    stockMovements: [],
    invoices: vehicles.slice(35, 40).map((v, i) => ({
      id: "demo-invoice-" + i,
      vehicle: v.id,
      total: 240 + i * 125,
      state: "Payée",
      at: new Date(now - (i + 2) * 86400000).toISOString(),
      demo: true,
    })),
    maintenance: vehicles.slice(40, 44).map((v) => ({
      id: "maintenance-" + v.id,
      vehicle: v.id,
      label: "Entretien à vérifier selon historique",
      due: new Date(now + 14 * 86400000).toISOString(),
      consent: false,
    })),
  };
}

````

## src/diagnostic-domain.ts

````typescript
import type { DB } from "./domain.ts";
export type DiagnosticCase = {
  id: string;
  vehicleId: string;
  at: string;
  symptoms: string;
  codes: string[];
  engine: string;
  tests: { name: string; result: string; done: boolean }[];
  hypotheses: {
    label: string;
    state: "Rejetée" | "À vérifier" | "Confirmée";
  }[];
  cause: string | null;
  repair: string;
  result: string;
  resolved: boolean;
  recurred: boolean;
  demo: boolean;
};
const normalized = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]{3,}/g) || [];
export function searchDiagnostics(db: DB, query: string, vehicleId?: string) {
  const target = db.vehicles.find((v) => v.id === vehicleId);
  const terms = new Set(normalized(query));
  return (db.diagnosticCases || [])
    .map((c) => {
      const v = db.vehicles.find((v) => v.id === c.vehicleId);
      if (!v) return null;
      const words = new Set(normalized(c.symptoms + " " + c.codes.join(" ")));
      const matches = [...terms].filter((w) => words.has(w));
      const sameModel = target?.make === v.make && target?.model === v.model;
      const sameEngine = !!target?.engine && target.engine === c.engine;
      const score = matches.length + (sameModel ? 2 : 0) + (sameEngine ? 1 : 0);
      const similarities = [
        ...matches.map((w) => "Terme partagé : " + w),
        ...(sameModel ? ["Même marque et modèle"] : []),
        ...(sameEngine ? ["Motorisation renseignée identique"] : []),
      ];
      const differences = target
        ? [
            ...(target.make !== v.make || target.model !== v.model
              ? ["Modèle différent : " + v.make + " " + v.model]
              : []),
            ...(!sameEngine ? ["Motorisation différente ou non vérifiée"] : []),
            ...(target.km !== v.km
              ? ["Kilométrage source : " + v.km.toLocaleString("fr-FR") + " km"]
              : []),
          ]
        : [
            "Véhicule courant non sélectionné : comparaison de motorisation impossible",
          ];
      return { case: c, vehicle: v, score, similarities, differences };
    })
    .filter(
      (r): r is NonNullable<typeof r> => !!r && (!query.trim() || r.score > 0),
    )
    .sort((a, b) => b.score - a.score);
}
export function extractDTC(text: string) {
  return [
    ...new Set(text.toUpperCase().match(/\b[PCBU][0-3][0-9A-F]{3}\b/g) || []),
  ];
}

````

## src/domain.ts

````typescript
import type { DealershipLayout } from "./dealership-layout.ts";
import { prepareClientMessage } from "./communication-domain.ts";
import { createDemo } from "./demo.ts";
import { team, type Department } from "./team-data.ts";
import type { Appointment } from "./planning-domain.ts";
import type { DiagnosticCase } from "./diagnostic-domain.ts";
import type { ManagerAlert } from "./dashboard-domain.ts";
import type { WorkshopState } from "./workshop-domain.ts";
import type { FieldEvidence } from "./identification.ts";
export const statuses = [
  "Réception",
  "Diagnostic",
  "Devis à valider",
  "En intervention",
  "Contrôle qualité",
  "Prêt à livrer",
  "Livré",
] as const;
export type Status = (typeof statuses)[number];
export type Vehicle = {
  id: string;
  make: string;
  model: string;
  plate: string;
  client: string;
  phone: string;
  email: string;
  km: number;
  year: number;
  color: string;
  shape: "sedan" | "suv" | "hatch";
  symptoms: string;
  codes: string;
  status: Status;
  technician: string;
  bay: number | null;
  due: string;
  quality: boolean;
  notes: string;
  parts: string[];
  vin?: string;
  country?: string;
  assetId?: string;
  registrationEvidence?: FieldEvidence[];
  present?: boolean;
  demo?: boolean;
  arrivedAt?: string;
  estimatedMinutes?: number;
  engine?: string;
  department?: Department;
  partReservations?: Record<string, number>;
};
export type Part = {
  id: string;
  name: string;
  ref: string;
  stock: number;
  reserved: number;
  price: number;
  location: string;
  threshold: number;
  category?: string;
  unit?: string;
  purchasePrice?: number;
  brand?: string;
  supplier?: string;
  lastMovement?: string;
  demo?: boolean;
};
export type Audit = { id: string; at: string; vehicle: string; action: string };
export type DB = {
  version: 1;
  vehicles: Vehicle[];
  parts: Part[];
  audit: Audit[];
  orders: {
    id: string;
    part: string;
    quantity: number;
    status: string;
    at?: string;
  }[];
  messages: { id: string; vehicle: string; text: string }[];
  workshop?: Record<string, WorkshopState>;
  quotes?: Quote[];
  assetDisabled?: string[];
  demoVersion?: number;
  dealership?: DealershipLayout;
  appointments?: Appointment[];
  diagnosticCases?: DiagnosticCase[];
  alerts?: ManagerAlert[];
  stockMovements?: {
    id: string;
    part: string;
    vehicle: string;
    kind: string;
    quantity: number;
    at: string;
  }[];
  invoices?: {
    id: string;
    vehicle: string;
    total: number;
    state: string;
    at: string;
    demo: boolean;
  }[];
  maintenance?: {
    id: string;
    vehicle: string;
    label: string;
    due: string;
    consent: boolean;
  }[];
};
export type Quote = {
  id: string;
  vehicle: string;
  lines: { id: string; label: string; quantity: number; unitPrice: number }[];
  vat: number;
  state: "Brouillon" | "À valider" | "Validé";
  at: string;
};
export const technicians = ["Non affecté", ...team.map((t) => t.name)];
export const bayPosition = (
  bay: number,
  layout?: DealershipLayout,
): [number, number] => [7, -12 - (bay - 1) * (layout?.workshopSpacing || 5)];
export function vehiclePosition(
  v: Vehicle,
  all: Vehicle[],
  layout?: DealershipLayout,
): [number, number] {
  if (v.bay) return bayPosition(v.bay, layout);
  const ready = all.filter(
    (c) => c.status === "Prêt à livrer" && c.bay === null,
  );
  const ri = ready.findIndex((c) => c.id === v.id);
  if (ri >= 0 && ri < 4)
    return [15 + (ri % 2) * 4, 10 + Math.floor(ri / 2) * 5];
  const parked = all.filter(
    (c) =>
      c.bay === null &&
      c.status !== "Livré" &&
      c.present !== false &&
      (c.status !== "Prêt à livrer" ||
        ready.findIndex((r) => r.id === c.id) >= 4),
  );
  const i = Math.max(
    0,
    parked.findIndex((c) => c.id === v.id),
  );
  return [-7, -12 - i * (layout?.workshopSpacing || 5)];
}
export const zones = [
  { id: "accueil", name: "Accueil", short: "Accueil", x: -17, z: 10 },
  { id: "atelier", name: "Atelier mécanique", short: "Atelier", x: 0, z: -28 },
  { id: "attente", name: "Salle d’attente", short: "Attente", x: -17, z: -3 },
  { id: "stock", name: "Magasin & stocks", short: "Stocks", x: 17, z: -12 },
  { id: "carrosserie", name: "Carrosserie", short: "Carrosserie", x: 17, z: 0 },
  {
    id: "bureau",
    name: "Bureau du responsable",
    short: "Bureau",
    x: -17,
    z: -13,
  },
  { id: "livraison", name: "Livraison", short: "Livraison", x: 17, z: 15 },
  { id: "showroom", name: "Showroom", short: "Showroom", x: 0, z: 14 },
  { id: "parking", name: "Parc atelier", short: "Parc", x: -7, z: -28 },
];
export function seed(): DB {
  return createDemo();
}
export function record(db: DB, vehicle: string, action: string): DB {
  return {
    ...db,
    audit: [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        vehicle,
        action,
      },
      ...db.audit,
    ],
  };
}
export function updateVehicle(db: DB, id: string, patch: Partial<Vehicle>): DB {
  const old = db.vehicles.find((v) => v.id === id);
  if (!old) throw Error("Dossier introuvable.");
  const next = { ...old, ...patch };
  if (next.status === "Prêt à livrer" && !next.quality)
    throw Error("Validez le contrôle qualité avant la livraison.");
  if (
    next.status === "Livré" &&
    old.status !== "Prêt à livrer" &&
    old.status !== "Livré"
  )
    throw Error("Le véhicule doit être prêt à livrer.");
  if (
    next.bay !== null &&
    db.vehicles.some(
      (v) => v.id !== id && v.bay === next.bay && v.status !== "Livré",
    )
  )
    throw Error("Ce poste est déjà occupé.");
  if (next.status === "Prêt à livrer" || next.status === "Livré")
    next.bay = null;
  if (next.status === "Livré") next.present = false;
  const result = record(
    { ...db, vehicles: db.vehicles.map((v) => (v.id === id ? next : v)) },
    id,
    patch.status ? `Statut : ${next.status}` : "Dossier mis à jour",
  );
  return old.status !== next.status && next.status === "Prêt à livrer"
    ? prepareClientMessage(result, id, "pickup")
    : result;
}
export function reservePart(db: DB, vehicle: string, id: string): DB {
  const part = db.parts.find((p) => p.id === id);
  const car = db.vehicles.find((v) => v.id === vehicle);
  if (!part || !car) throw Error("Pièce ou véhicule introuvable.");
  if (car.parts.includes(id))
    throw Error("Cette pièce est déjà réservée pour ce dossier.");
  if (part.stock - part.reserved < 1)
    throw Error("Stock disponible insuffisant. Préparez une commande.");
  return record(
    {
      ...db,
      parts: db.parts.map((p) =>
        p.id === id ? { ...p, reserved: p.reserved + 1 } : p,
      ),
      vehicles: db.vehicles.map((v) =>
        v.id === vehicle ? { ...v, parts: [...v.parts, id] } : v,
      ),
    },
    vehicle,
    `Pièce réservée : ${part.name}`,
  );
}
export const cases = [
  {
    id: "CAS-001",
    title: "Défauts électriques multiples",
    vehicle: "Range Rover · Diesel · 2018",
    symptoms:
      "démarrage difficile défauts électriques direction intermittente batterie tension masse",
    codes: ["P0562", "U0100"],
    cause: "Connexion de masse oxydée, confirmée après mesure.",
    checks: [
      "Mesurer la tension batterie au repos et au démarrage.",
      "Contrôler les chutes de tension des liaisons de masse.",
      "Vérifier les connecteurs avant de remplacer un calculateur.",
    ],
    result: "Résolution confirmée après essais et contrôle à 30 jours.",
  },
  {
    id: "CAS-002",
    title: "Vibrations au freinage",
    vehicle: "BMW Série 3 · Diesel · 2019",
    symptoms: "vibrations freinage bruit train avant roue disque frein",
    codes: [],
    cause: "Voile des disques avant mesuré au comparateur.",
    checks: [
      "Mesurer le voile et l’épaisseur des disques.",
      "Contrôler les moyeux et le jeu du train avant.",
      "Comparer les valeurs à la documentation applicable.",
    ],
    result: "Absence de vibration après intervention et essai routier.",
  },
  {
    id: "CAS-003",
    title: "Pression de suralimentation insuffisante",
    vehicle: "Peugeot 3008 · Diesel · 2020",
    symptoms: "perte puissance voyant moteur turbo pression durite",
    codes: ["P0299"],
    cause: "Durite de suralimentation fissurée, fuite confirmée.",
    checks: [
      "Inspecter le circuit de suralimentation.",
      "Comparer pression demandée et mesurée.",
      "Effectuer un test d’étanchéité selon la procédure constructeur.",
    ],
    result: "Pression rétablie et code absent après essai.",
  },
];
const words = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]{4,}/g) || [];
export function similarCases(query: string) {
  const terms = new Set(words(query));
  return cases
    .map((c) => ({
      ...c,
      score: words(c.symptoms + " " + c.codes.join(" ")).filter((w) =>
        terms.has(w),
      ).length,
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
}
export function loadDB(raw: string | null): DB {
  if (!raw) return seed();
  const d = JSON.parse(raw);
  const invalid = () => {
    throw Error("Sauvegarde invalide ou incompatible.");
  };
  if (
    !d ||
    d.version !== 1 ||
    !Array.isArray(d.vehicles) ||
    !Array.isArray(d.parts) ||
    !Array.isArray(d.audit) ||
    !Array.isArray(d.orders) ||
    !Array.isArray(d.messages)
  )
    return invalid();
  const str = (x: unknown) => typeof x === "string";
  const number = (x: unknown) =>
    typeof x === "number" && Number.isFinite(x) && x >= 0;
  if (
    d.dealership !== undefined &&
    (!d.dealership ||
      !["leftBrand", "rightBrand"].every(
        (k) =>
          str(d.dealership[k]) &&
          d.dealership[k].trim().length > 0 &&
          d.dealership[k].length <= 40,
      ) ||
      typeof d.dealership.waitingRoom !== "boolean")
  )
    return invalid();
  if (
    d.dealership?.workshopSpacing !== undefined &&
    ![5, 6, 7].includes(d.dealership.workshopSpacing)
  )
    return invalid();
  for (const v of d.vehicles) {
    if (
      !v ||
      ![
        "id",
        "make",
        "model",
        "plate",
        "client",
        "phone",
        "email",
        "color",
        "symptoms",
        "codes",
        "technician",
        "due",
        "notes",
      ].every((k) => str(v[k])) ||
      !/^#[0-9a-f]{6}$/i.test(v.color) ||
      !number(v.km) ||
      !number(v.year) ||
      !["sedan", "suv", "hatch"].includes(v.shape) ||
      !statuses.includes(v.status) ||
      typeof v.quality !== "boolean" ||
      !Array.isArray(v.parts) ||
      !v.parts.every(str) ||
      !(v.bay === null || (Number.isInteger(v.bay) && v.bay >= 1 && v.bay <= 8))
    )
      return invalid();
  }
  for (const p of d.parts) {
    if (
      !p ||
      !["id", "name", "ref", "location"].every((k) => str(p[k])) ||
      !["stock", "reserved", "price", "threshold"].every((k) => number(p[k])) ||
      p.reserved > p.stock
    )
      return invalid();
  }
  for (const a of d.audit) {
    if (!a || !["id", "at", "vehicle", "action"].every((k) => str(a[k])))
      return invalid();
  }
  for (const o of d.orders) {
    if (
      !o ||
      !str(o.id) ||
      !str(o.part) ||
      !str(o.status) ||
      (o.at !== undefined &&
        (!str(o.at) || !Number.isFinite(Date.parse(o.at)))) ||
      !Number.isInteger(o.quantity) ||
      o.quantity < 1 ||
      !d.parts.some((p: Part) => p.id === o.part)
    )
      return invalid();
  }
  for (const m of d.messages) {
    if (!m || !["id", "vehicle", "text"].every((k) => str(m[k])))
      return invalid();
  }
  if (
    new Set(d.vehicles.map((v: Vehicle) => v.id)).size !== d.vehicles.length ||
    new Set(d.parts.map((p: Part) => p.id)).size !== d.parts.length
  )
    return invalid();
  if (
    d.assetDisabled !== undefined &&
    (!Array.isArray(d.assetDisabled) || !d.assetDisabled.every(str))
  )
    return invalid();
  for (const v of d.vehicles) {
    if (
      (v.vin !== undefined && !str(v.vin)) ||
      (v.country !== undefined && !["FR", "PT", "ES"].includes(v.country)) ||
      (v.assetId !== undefined && !str(v.assetId))
    )
      return invalid();
    if (
      v.registrationEvidence !== undefined &&
      (!Array.isArray(v.registrationEvidence) ||
        v.registrationEvidence.some(
          (f: any) =>
            !f ||
            !str(f.code) ||
            !str(f.label) ||
            !str(f.raw) ||
            !str(f.value) ||
            typeof f.confirmed !== "boolean" ||
            !["pdf_text", "ocr_local", "manual"].includes(f.source),
        ))
    )
      return invalid();
  }
  if (d.quotes !== undefined) {
    if (!Array.isArray(d.quotes)) return invalid();
    for (const q of d.quotes) {
      if (
        !q ||
        !str(q.id) ||
        !d.vehicles.some((v: Vehicle) => v.id === q.vehicle) ||
        !["Brouillon", "À valider", "Validé"].includes(q.state) ||
        !number(q.vat) ||
        q.vat > 100 ||
        !str(q.at) ||
        !Array.isArray(q.lines) ||
        q.lines.some(
          (l: any) =>
            !l ||
            !str(l.id) ||
            !str(l.label) ||
            !number(l.quantity) ||
            l.quantity <= 0 ||
            !number(l.unitPrice),
        )
      )
        return invalid();
    }
  }
  if (d.workshop !== undefined) {
    if (
      !d.workshop ||
      Array.isArray(d.workshop) ||
      typeof d.workshop !== "object"
    )
      return invalid();
    for (const [id, state] of Object.entries(d.workshop) as [string, any][]) {
      if (
        !d.vehicles.some((v: Vehicle) => v.id === id) ||
        !state ||
        !number(state.elapsed) ||
        !(
          state.runningSince === null ||
          (str(state.runningSince) &&
            Number.isFinite(Date.parse(state.runningSince)))
        ) ||
        !state.checks ||
        !["repair", "safety", "test"].every(
          (k) => typeof state.checks[k] === "boolean",
        ) ||
        !str(state.keyLocation) ||
        !["issues", "photos", "reports", "requests"].every((k) =>
          Array.isArray(state[k]),
        )
      )
        return invalid();
      if (
        state.photos.length > 3 ||
        state.photos.some(
          (p: any) =>
            !p ||
            !str(p.id) ||
            !str(p.at) ||
            !str(p.data) ||
            !p.data.startsWith("data:image/jpeg;base64,") ||
            p.data.length > 1500000,
        )
      )
        return invalid();
      for (const kind of ["issues", "reports"])
        if (
          state[kind].some(
            (x: any) => !x || !str(x.id) || !str(x.text) || !str(x.at),
          )
        )
          return invalid();
      if (
        state.requests.some(
          (r: any) =>
            !r || !str(r.id) || !str(r.part) || !str(r.at) || !str(r.state),
        )
      )
        return invalid();
    }
  }
  for (const field of [
    "appointments",
    "diagnosticCases",
    "alerts",
    "stockMovements",
    "invoices",
    "maintenance",
  ])
    if (d[field] !== undefined && !Array.isArray(d[field])) return invalid();
  if (
    d.appointments?.some(
      (a: any) =>
        !a ||
        !str(a.id) ||
        !d.vehicles.some((v: Vehicle) => v.id === a.vehicle) ||
        !str(a.technician) ||
        !str(a.resource) ||
        !str(a.department) ||
        !Number.isFinite(Date.parse(a.start)) ||
        !number(a.duration) ||
        a.duration < 15 ||
        !Number.isFinite(Date.parse(a.promised)) ||
        !Array.isArray(a.requiredParts) ||
        !a.requiredParts.every(str) ||
        !["Planifié", "En cours", "En pause", "Terminé"].includes(a.state) ||
        typeof a.arrived !== "boolean",
    )
  )
    return invalid();
  if (
    d.diagnosticCases?.some(
      (c: any) =>
        !c ||
        !str(c.id) ||
        !d.vehicles.some((v: Vehicle) => v.id === c.vehicleId) ||
        !str(c.symptoms) ||
        !str(c.engine) ||
        !Array.isArray(c.codes) ||
        !c.codes.every(str) ||
        !Array.isArray(c.tests) ||
        c.tests.some(
          (t: any) =>
            !t || !str(t.name) || !str(t.result) || typeof t.done !== "boolean",
        ) ||
        !Array.isArray(c.hypotheses) ||
        !str(c.repair) ||
        !str(c.result) ||
        typeof c.resolved !== "boolean" ||
        !(c.cause === null || str(c.cause)),
    )
  )
    return invalid();
  if (
    d.alerts?.some(
      (a: any) =>
        !a ||
        !str(a.id) ||
        !str(a.vehicle) ||
        !str(a.message) ||
        !str(a.kind) ||
        typeof a.resolved !== "boolean",
    )
  )
    return invalid();
  if (
    d.invoices?.some(
      (i: any) =>
        !i ||
        !str(i.id) ||
        !d.vehicles.some((v: Vehicle) => v.id === i.vehicle) ||
        !number(i.total) ||
        !str(i.state),
    )
  )
    return invalid();
  return d as DB;
}

````

## src/guided-domain.ts

````typescript
import type { DB, Vehicle } from "./domain.ts";
export type ShowroomCar = {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  available: boolean;
  demo: boolean;
};
export const demoShowroom: ShowroomCar[] = [
  {
    id: "showroom-defender",
    make: "Land Rover",
    model: "Defender",
    year: 2023,
    color: "#59695f",
    available: true,
    demo: true,
  },
  {
    id: "showroom-range",
    make: "Land Rover",
    model: "Range Rover",
    year: 2023,
    color: "#8b3b42",
    available: true,
    demo: true,
  },
  {
    id: "showroom-jaguar",
    make: "Jaguar",
    model: "F-Pace",
    year: 2022,
    color: "#253f59",
    available: true,
    demo: true,
  },
];
export function showroomCars(db: DB): ShowroomCar[] {
  return db.demoVersion ? demoShowroom : [];
}
export function waitingVehicles(db: DB) {
  // Explicit simulation slots; never infer a real client's physical presence from their repair status.
  return db.demoVersion
    ? ["v11", "v12", "v13"]
        .map((id) => db.vehicles.find((v) => v.id === id))
        .filter(
          (v): v is Vehicle =>
            !!v && v.present !== false && v.status !== "Livré",
        )
    : [];
}
export function zoneVehicles(db: DB, zone: string) {
  return db.vehicles.filter(
    (v) =>
      v.present !== false &&
      v.status !== "Livré" &&
      (zone === "livraison"
        ? v.status === "Prêt à livrer"
        : zone === "parking"
          ? !v.bay && v.status !== "Prêt à livrer"
          : !!v.bay),
  );
}

export function todaysOrders(db: DB, now = new Date()) {
  const day = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  return db.orders.filter(
    (o) =>
      o.at &&
      Number.isFinite(Date.parse(o.at)) &&
      day(new Date(o.at)) === day(now),
  );
}
export function awaitingOrders(db: DB) {
  return db.orders.filter(
    (o) => !["Reçue", "Annulée", "Livrée"].includes(o.status),
  );
}

````

## src/identification.ts

````typescript
import type { DB, Vehicle } from "./domain.ts";
export type FieldEvidence = {
  code: string;
  label: string;
  raw: string;
  value: string;
  source: "pdf_text" | "ocr_local" | "manual";
  confidence: number | null;
  confirmed: boolean;
  extractedAt: string;
  reviewedAt: string | null;
  corrected: boolean;
  box: { x: number; y: number; w: number; h: number; page: number } | null;
};
export function validVIN(vin: string) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase().trim());
}
export function identifyLocal(
  db: DB,
  query: { plate?: string; vin?: string; country?: string },
): {
  state: "identified" | "conflict" | "not_found" | "needs_confirmation";
  matches: Vehicle[];
  source: string;
  message: string;
} {
  const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (query.vin && !validVIN(query.vin))
    return {
      state: "needs_confirmation",
      matches: [],
      source: "Contrôle de format local",
      message:
        "VIN attendu : 17 caractères sans I, O ou Q. Vérifiez le document ; aucune donnée n’a été déduite.",
    };
  const vinMatches = query.vin
    ? db.vehicles.filter(
        (v) => v.vin && normalize(v.vin) === normalize(query.vin!),
      )
    : [];
  const plateMatches = query.plate
    ? db.vehicles.filter(
        (v) =>
          (v.country || "FR") === (query.country || "FR") &&
          normalize(v.plate) === normalize(query.plate!),
      )
    : [];
  if (
    query.vin &&
    query.plate &&
    vinMatches.length &&
    plateMatches.length &&
    !vinMatches.some((v) => plateMatches.some((p) => p.id === v.id))
  )
    return {
      state: "conflict",
      matches: [...vinMatches, ...plateMatches],
      source: "Dossiers internes",
      message:
        "La plaque et le VIN correspondent à des dossiers différents. Vérifiez les sources avant tout rattachement.",
    };
  const matches = vinMatches.length ? vinMatches : plateMatches;
  return matches.length
    ? {
        state: "identified",
        matches,
        source: "Dossiers internes du serveur AutoHub",
        message:
          "Correspondance avec un dossier local. La motorisation n’est pas vérifiée par une source constructeur.",
      }
    : {
        state: "not_found",
        matches: [],
        source: "Dossiers internes uniquement",
        message:
          "Aucune correspondance locale. Complétez la fiche manuellement ou scannez le document. Aucun service de recherche par plaque n’est connecté.",
      };
}
const specs = [
  ["A", "Immatriculation"],
  ["B", "Première immatriculation"],
  ["C.1", "Titulaire"],
  ["D.1", "Marque"],
  ["D.2", "Type / variante / version"],
  ["D.3", "Modèle commercial"],
  ["E", "VIN"],
  ["F.2", "Masse maximale"],
  ["G.1", "Masse à vide"],
  ["J.1", "Genre"],
  ["P.1", "Cylindrée"],
  ["P.2", "Puissance"],
  ["P.3", "Énergie"],
  ["P.6", "Puissance administrative"],
  ["S.1", "Places"],
  ["V.7", "CO₂"],
] as const;
export function extractRegistration(
  text: string,
  source: FieldEvidence["source"],
): FieldEvidence[] {
  // Conservative: explicit labels only. Missing values stay empty for manual completion.
  const escaped = specs
    .map(([c]) => c.replaceAll(".", "\\."))
    .sort((a, b) => b.length - a.length)
    .join("|");
  const re = new RegExp(
    "(?:^|[\\n\\r])\\s*(" + escaped + ")(?:\\s*[:=]\\s*|\\s+)([^\\n\\r]+)",
    "g",
  );
  const found = new Map<string, string>();
  for (const match of text.matchAll(re)) {
    if (!found.has(match[1])) found.set(match[1], match[2].trim());
  }
  return specs.map(([code, label]) => {
    const raw = found.get(code) || "";
    let value = raw;
    if (code === "E") value = value.toUpperCase().replaceAll(" ", "");
    if (code === "A") value = value.toUpperCase();
    if (code === "E" && value && !validVIN(value)) value = "";
    return {
      code,
      label,
      raw,
      value,
      source,
      confidence: null,
      confirmed: false,
      extractedAt: new Date().toISOString(),
      reviewedAt: null,
      corrected: false,
      box: null,
    };
  });
}

````

## src/main.tsx

````tsx
import { quoteTotals } from "./quote-domain";
import { GuidedContext, ClientContext, VehicleSummary } from "./GuidedContext";
import { DeliveryDeadline } from "./DeliveryDeadline";
import { layoutFor } from "./dealership-layout";
import { prepareClientMessage } from "./communication-domain";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Buildings,
  Car,
  CalendarDots,
  Users,
  Package,
  Brain,
  ChartLine,
  GearSix,
  Plus,
  MagnifyingGlass,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Clock,
  Export,
  FloppyDisk,
  MapTrifold,
  PersonSimpleWalk,
  Cube,
  ArrowsOut,
  WarningCircle,
  ShieldCheck,
  HandPalm,
  Wrench,
  Envelope,
  CheckCircle,
  Eye,
  SteeringWheel,
  ArrowCounterClockwise,
  FileText,
  Scan,
} from "@phosphor-icons/react";
import { GarageScene, type Selection, type Mode } from "./scene";
import {
  seed,
  loadDB,
  record,
  updateVehicle,
  reservePart,
  similarCases,
  statuses,
  technicians,
  zones,
  type DB,
  type Vehicle,
  type Status,
} from "./domain";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "./style.css";
import { Workshop } from "./Workshop";
import { AssetLibrary } from "./AssetLibrary";
import { Quotes } from "./Quotes";
import { ScanPanel } from "./ScanPanel";
import { changeServer, readServer, syncClock, type Snapshot } from "./api";
import { Stocks } from "./Stocks";
import { Intelligence } from "./Intelligence";
import { Planning } from "./Planning";
import { Team } from "./Team";
import { Pilotage } from "./Pilotage";
import { dashboard, isPresent } from "./dashboard-domain";
import { persistDB, STORAGE_KEY } from "./persistence";
import { duplicateVehicle, workshopFor } from "./workshop-domain";
import { identifyLocal, validVIN, type FieldEvidence } from "./identification";
const KEY = STORAGE_KEY;
function orderID() {
  try {
    return location.hash.startsWith("#ordre=")
      ? decodeURIComponent(location.hash.slice(7))
      : "";
  } catch {
    return "";
  }
}
function hasLegacyBackup() {
  try {
    return !!localStorage.getItem("autohub-local-v1");
  } catch {
    return false;
  }
}
function readInitial() {
  try {
    return { db: loadDB(localStorage.getItem(KEY)), error: "" };
  } catch {
    return {
      db: seed(),
      error:
        "La sauvegarde existante est illisible et a été conservée. Restaurez un fichier valide ou réinitialisez la démonstration dans les paramètres.",
    };
  }
}
const initial = readInitial();
const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );
function Badge({ status }: { status: Status }) {
  return (
    <span
      className={
        "badge " +
        (status === "Prêt à livrer" || status === "Livré"
          ? "green"
          : status === "Devis à valider"
            ? "amber"
            : status === "En intervention"
              ? "red"
              : status === "Diagnostic"
                ? "slate"
                : "blue")
      }
    >
      <i />
      {status}
    </span>
  );
}
function App() {
  const [storageError, setStorageError] = useState(initial.error);
  const [canSave, setCanSave] = useState(!initial.error);
  const [db, setDB] = useState<DB>(initial.db);
  const dbRef = useRef(db);
  const revision = useRef(-1),
    queue = useRef<Promise<unknown>>(Promise.resolve());
  const [serverReady, setServerReady] = useState(false);
  function acceptSnapshot(snapshot: Snapshot) {
    if (snapshot.revision < revision.current) return;
    revision.current = snapshot.revision;
    syncClock(snapshot.serverNow);
    dbRef.current = snapshot.db;
    setDB(snapshot.db);
    setCanSave(true);
    setServerReady(true);
    setStorageError("");
  }
  useEffect(() => {
    let mounted = true;
    readServer()
      .then((s) => {
        if (mounted) acceptSnapshot(s);
      })
      .catch(() => {
        if (mounted)
          setStorageError(
            "Serveur AutoHub indisponible : les modifications sont bloquées jusqu’à reconnexion.",
          );
      });
    const stream = new EventSource("/api/events");
    stream.onmessage = (e) => {
      if (mounted) acceptSnapshot(JSON.parse(e.data));
    };
    stream.onerror = () => {
      if (mounted) {
        setServerReady(false);
        setStorageError(
          "Connexion serveur interrompue. Les changements ne sont pas déclarés synchronisés.",
        );
      }
    };
    return () => {
      mounted = false;
      stream.close();
    };
  }, []);
  useEffect(() => {
    dbRef.current = db;
  }, [db]);
  const [view, setView] = useState(
    location.hash.startsWith("#ordre=") ? "atelier" : "garage",
  );
  const [selection, setSelection] = useState<Selection | null>(() =>
    location.hash.startsWith("#ordre=")
      ? { kind: "vehicle", id: orderID() }
      : null,
  );
  const [mode, setMode] = useState<Mode>("overview");
  const [gloves, setGloves] = useState(false);
  const [fullDossier, setFullDossier] = useState(false);
  const [zone, setZone] = useState("atelier");
  const [query, setQuery] = useState("");
  const [cohort, setCohort] = useState("all");
  const live = dashboard(db);
  function cohortIDs(filter: string) {
    return filter === "ready"
      ? live.ready.map((v) => v.id)
      : filter === "blocked"
        ? live.blocked.map((v) => v.id)
        : filter === "late"
          ? live.late.map((v) => v.id)
          : filter === "running"
            ? live.running.map((v) => v.id)
            : filter === "invoiced"
              ? (db.invoices || []).map((i) => i.vehicle)
              : filter === "present"
                ? live.present.map((v) => v.id)
                : db.vehicles.map((v) => v.id);
  }
  function filterDossiers(filter: string) {
    setCohort(filter);
    setQuery("");
    setView("garage");
    setSelection(null);
  }
  function openDossier(id: string) {
    setSelection({ kind: "vehicle", id });
    setTab("dossier");
    setView("garage");
  }
  const [toast, setToast] = useState("");
  const [hint, setHint] = useState("");
  const [pos, setPos] = useState<[number, number]>([-17, 13]);
  const [tab, setTab] = useState("dossier");
  const [creation, setCreation] = useState(false);
  const [error3d, setError3d] = useState("");
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [low, setLow] = useState(false);
  const [speed, setSpeed] = useState(3.8);
  const [selectedPart, setSelectedPart] = useState("disc");
  const [inspect, setInspect] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [searched, setSearched] = useState(false);
  const host = useRef<HTMLDivElement>(null),
    scene = useRef<GarageScene | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const car = db.vehicles.find((v) => v.id === selection?.id);
  const visible = db.vehicles
    .filter((v) => cohortIDs(cohort).includes(v.id))
    .filter((v) =>
      (v.make + " " + v.model + " " + v.plate + " " + v.client + " " + v.phone)
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const notify = (text: string) => {
    setToast(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  };
  function transact(
    type: string,
    vehicle: string | undefined,
    payload: any,
    success?: string,
  ): Promise<boolean> {
    const task = queue.current.then(async () => {
      try {
        if (revision.current < 0)
          throw Error("Attendez la connexion au serveur.");
        const snapshot = await changeServer(
          revision.current,
          type,
          vehicle,
          payload,
        );
        acceptSnapshot(snapshot);
        if (success) notify(success);
        return true;
      } catch (e) {
        notify((e as Error).message);
        try {
          acceptSnapshot(await readServer());
        } catch {}
        return false;
      }
    });
    queue.current = task;
    return task;
  }
  function commit(fn: (db: DB) => DB, success?: string): Promise<boolean> {
    const task = queue.current.then(async () => {
      try {
        if (revision.current < 0)
          throw Error("Attendez la connexion au serveur.");
        const next = fn(dbRef.current);
        const snapshot = await changeServer(
          revision.current,
          "snapshot",
          undefined,
          { db: next },
        );
        acceptSnapshot(snapshot);
        if (success) notify(success);
        return true;
      } catch (e) {
        notify((e as Error).message);
        try {
          acceptSnapshot(await readServer());
        } catch {}
        return false;
      }
    });
    queue.current = task;
    return task;
  }
  const select = (s: Selection) => {
    setFullDossier(false);
    if (s.kind === "part") {
      setSelectedPart(s.id);
      setTab("pieces");
      return;
    }
    setSelection(s);
    setInspect(s.kind === "wheel");
    if (s.kind === "vehicle") {
      setMode("free");
      scene.current?.focusVehicle(s.id);
    }
    if (s.kind === "wheel") setMode("free");
    setTab(s.kind === "wheel" ? "pieces" : "dossier");
    const zoneId =
      s.kind === "zone"
        ? s.id
        : s.kind === "stock"
          ? "stock"
          : s.kind === "reception"
            ? "accueil"
            : s.kind === "office"
              ? "bureau"
              : s.kind === "delivery"
                ? "livraison"
                : null;
    if (zoneId) go(zoneId);
    else if (["customer", "technician", "inventory"].includes(s.kind)) {
      setMode("free");
      scene.current?.focusEntity(s.kind, s.id);
    }
  };
  useEffect(() => {
    if (!serverReady) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* Server is authoritative; a full browser cache does not discard persisted data. */
    }
  }, [db, serverReady]);
  useEffect(() => {
    if (view !== "garage" || !host.current) return;
    try {
      scene.current = new GarageScene(
        host.current,
        select,
        (x, z) => setPos([x, z]),
        setHint,
        setError3d,
        layoutFor(db.dealership),
      );
      scene.current.update(
        db.vehicles,
        db.assetDisabled,
        db.workshop,
        !!db.demoVersion,
      );
      scene.current.setMode(mode);
      if (car && selection?.kind !== "customer" && isPresent(car) && !inspect) {
        scene.current.focusVehicle(car.id);
        setMode("free");
      }
      scene.current.reduced = reduced;
      scene.current.speed = speed;
      scene.current.setQuality(low);
    } catch {
      setError3d(
        "Votre navigateur ne permet pas de démarrer la 3D. Utilisez les dossiers et le planning.",
      );
    }
    return () => {
      scene.current?.dispose();
      scene.current = null;
    };
  }, [view, db.dealership]);
  useEffect(() => {
    scene.current?.update(
      db.vehicles,
      db.assetDisabled,
      db.workshop,
      !!db.demoVersion,
    );
  }, [db.vehicles, db.assetDisabled]);
  useEffect(() => {
    scene.current?.setFocusIds(cohort === "all" ? [] : cohortIDs(cohort));
  }, [cohort, db, view]);
  useEffect(() => {
    scene.current?.setSelected(
      selection?.kind === "vehicle" || selection?.kind === "wheel"
        ? car?.id || null
        : null,
    );
    if (car && selection?.kind !== "customer")
      scene.current?.inspect(car.id, inspect);
  }, [selection, inspect, db.vehicles]);
  useEffect(() => {
    if (scene.current) {
      scene.current.reduced = reduced;
      scene.current.speed = speed;
      scene.current.setQuality(low);
    }
  }, [reduced, speed, low]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function changeMode(m: Mode) {
    setMode(m);
    scene.current?.setMode(m);
    setInspect(false);
  }
  function go(id: string) {
    setZone(id);
    setSelection({ kind: "zone", id });
    setInspect(false);
    setMode("free");
    scene.current?.go(id);
  }
  function exportDB() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "autohub-sauvegarde.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("Sauvegarde exportée.");
  }
  function prepareMessage(v: Vehicle, kind: "pickup" | "quote" = "pickup") {
    commit(
      (d) => prepareClientMessage(d, v.id, kind),
      "Brouillon WhatsApp préparé · aucun envoi effectué.",
    );
    setTab("historique");
  }
  const occupied = live.occupied.length;
  const active = live.present;
  useEffect(() => {
    const onHash = () => {
      if (location.hash.startsWith("#ordre=")) {
        const id = orderID();
        setSelection({ kind: "vehicle", id });
        setView("atelier");
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const nav = [
    ["garage", "Mon garage", Buildings],
    ["dossiers", "Dossiers véhicules", Car],
    ["atelier", "Mode atelier", Wrench],
    ["devis", "Devis & validations", FileText],
    ["planning", "Planning", CalendarDots],
    ["equipe", "Équipe", Users],
    ["stocks", "Pièces & stocks", Package],
    ["intelligence", "Garage intelligent", Brain],
    ["pilotage", "Pilotage", ChartLine],
    ["bibliotheque", "Bibliothèque 3D", Cube],
  ] as const;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          aria-label="AutoHub 3D, ouvrir le garage"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("garage");
          }}
        >
          <span className="brand-symbol">
            <Buildings size={25} weight="duotone" />
          </span>
          <span>
            autohub<span className="brand-3d">3D</span>
          </span>
        </a>
        <div className="garage-name">
          <span className="garage-monogram">AG</span>
          <div>
            <strong>Atelier Grand Parc</strong>
            <small>Garage de démonstration</small>
          </div>
          <span className="dot" />
        </div>
        <span className="nav-caption">ESPACE DE TRAVAIL</span>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              aria-label={label}
              title={label}
              className={view === id ? "nav-item active" : "nav-item"}
              onClick={() => {
                setView(id);
                setQuery("");
              }}
            >
              <Icon size={21} />
              <span>{label}</span>
              {id === "dossiers" && (
                <span className="nav-count">{active.length}</span>
              )}
              {id === "intelligence" && <span className="new-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <ShieldCheck size={23} />
            <strong>Votre atelier, connecté.</strong>
            <p>
              Prototype local
              <br />
              Données fictives et modifiables.
            </p>
            <span>
              <i /> Base SQLite · serveur local
            </span>
          </div>
          <button
            aria-label="Paramètres"
            title="Paramètres"
            className={"nav-item " + (view === "reglages" ? "active" : "")}
            onClick={() => setView("reglages")}
          >
            <GearSix size={21} />
            Paramètres
          </button>
          <div className="user">
            <span>ÉS</span>
            <div>
              <strong>Eythan</strong>
              <small>Responsable d’atelier</small>
            </div>
            <button
              aria-label="Ouvrir les paramètres"
              onClick={() => setView("reglages")}
            >
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            Atelier Grand Parc <span>/</span>{" "}
            <strong>
              {nav.find((n) => n[0] === view)?.[1] || "Paramètres"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="demo">
              <i /> Mode démonstration
            </span>
            <button
              className="icon-button"
              onClick={exportDB}
              aria-label="Exporter une sauvegarde"
            >
              <Export size={20} />
            </button>
            <span className="avatar">ÉS</span>
          </div>
        </header>
        <main
          className={`${gloves ? "glove-mode" : ""} ${view === "garage" ? "spatial-workspace" : ""}`}
        >
          <div className="page-heading">
            <div>
              <div className="eyebrow">AUTOHUB · VOTRE ESPACE AUTOMOBILE</div>
              <h1>
                {view === "garage"
                  ? "Une nouvelle perspective sur votre atelier."
                  : nav.find((n) => n[0] === view)?.[1] ||
                    "Paramètres de l’atelier"}
              </h1>
              <p>
                {view === "garage"
                  ? "Entrez dans votre garage. Chaque véhicule, chaque poste, chaque dossier à portée de main."
                  : view === "intelligence"
                    ? "Retrouvez l’expérience de votre atelier et les cas techniques similaires."
                    : "Les données de votre garage, réunies dans un espace de travail."}
              </p>
            </div>
            <button className="primary" onClick={() => setCreation(true)}>
              <Plus size={18} />
              Nouvelle réception
            </button>
          </div>
          {(storageError || error3d) && (
            <div className="notice">
              <WarningCircle />
              {storageError || error3d}
              <button onClick={() => setView("dossiers")}>
                Ouvrir les dossiers
              </button>
            </div>
          )}
          {cohort !== "all" && (
            <div className="cohort-bar">
              <span>
                {visible.length} dossiers · filtre {cohort}
              </span>
              <button className="secondary" onClick={() => setCohort("all")}>
                Afficher tous les dossiers
              </button>
            </div>
          )}
          <div className="metrics clickable-metrics">
            <button onClick={() => filterDossiers("present")}>
              <span>Véhicules présents</span>
              <strong>
                {live.present.length}
                <small>dans votre garage</small>
              </strong>
            </button>
            <button onClick={() => setView("planning")}>
              <span>Postes occupés</span>
              <strong>
                {live.occupied.length}
                <em>/ 8</em>
                <small>{8 - live.occupied.length} disponibles</small>
              </strong>
            </button>
            <button onClick={() => setView("devis")}>
              <span>Devis validés</span>
              <strong>
                {live.accepted.length}
                <small>accord enregistré</small>
              </strong>
            </button>
            <button onClick={() => filterDossiers("ready")}>
              <span>Prêts à livrer</span>
              <strong>
                {live.ready.length}
                <small className="text-green">contrôle validé</small>
              </strong>
            </button>
          </div>
          {view === "garage" ? (
            <div
              className={
                "garage-layout " +
                (selection ? "has-context " : "") +
                (mode === "walk" && !selection ? "immersive" : "")
              }
            >
              <section className="scene-card">
                <div className="scene-toolbar">
                  <div className="scene-title">
                    <span className="live-dot" />
                    <strong>{zones.find((z) => z.id === zone)?.name}</strong>
                    <span>Environnement 3D</span>
                  </div>
                  <div className="guided-toolbar">
                    <button
                      className="secondary"
                      onClick={() => {
                        setSelection(null);
                        changeMode("overview");
                      }}
                    >
                      Vue d’ensemble
                    </button>
                    <button
                      className={gloves ? "primary" : "secondary"}
                      aria-pressed={gloves}
                      onClick={() => setGloves(!gloves)}
                    >
                      <HandPalm size={22} />
                      {gloves ? "Mains sales activé" : "Mains sales"}
                    </button>
                  </div>
                </div>
                <nav className="guided-zones" aria-label="Zones du garage">
                  {zones
                    .filter(
                      (z) =>
                        layoutFor(db.dealership).waitingRoom ||
                        z.id !== "attente",
                    )
                    .map((z) => (
                      <button
                        key={z.id}
                        className={
                          zone === z.id && mode !== "overview" ? "active" : ""
                        }
                        onClick={() => go(z.id)}
                      >
                        {z.short}
                      </button>
                    ))}
                </nav>
                <div className="scene-viewport">
                  <div ref={host} className="canvas-host" />
                  {car &&
                    selection?.kind !== "customer" &&
                    isPresent(car) &&
                    mode !== "walk" && (
                      <div
                        className="vehicle-view-controls"
                        aria-label="Points de vue du véhicule"
                      >
                        {[false, true].map((rear) => (
                          <button
                            key={String(rear)}
                            onClick={() => {
                              setInspect(false);
                              scene.current?.inspect(car.id, false);
                              scene.current?.focusVehicle(car.id, rear);
                              setMode("free");
                            }}
                          >
                            {rear ? "Autre côté" : "Recentrer"}
                          </button>
                        ))}
                        <button onClick={() => changeMode("overview")}>
                          Vue atelier
                        </button>
                      </div>
                    )}
                  <div className="zone-menu guided-zone-menu">
                    <label htmlFor="destination">SE DÉPLACER VERS</label>
                    <select
                      id="destination"
                      value={zone}
                      onChange={(e) => go(e.target.value)}
                    >
                      {zones
                        .filter(
                          (z) =>
                            layoutFor(db.dealership).waitingRoom ||
                            z.id !== "attente",
                        )
                        .map((z) => (
                          <option value={z.id} key={z.id}>
                            {z.short}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="mini-map">
                    <div>
                      <MapTrifold size={14} />
                      <span>PLAN DU GARAGE</span>
                      <button
                        aria-label="Revenir à la vue globale"
                        onClick={() => changeMode("overview")}
                      >
                        <ArrowsOut size={14} />
                      </button>
                    </div>
                    <svg
                      viewBox={`-24 ${-19 - 7 * (db.dealership?.workshopSpacing || 5)} 48 ${51 + 7 * (db.dealership?.workshopSpacing || 5)}`}
                      role="img"
                      aria-label="Plan interactif du garage"
                    >
                      <rect
                        x="-22"
                        y={-17 - 7 * (db.dealership?.workshopSpacing || 5)}
                        width="44"
                        height={35 + 7 * (db.dealership?.workshopSpacing || 5)}
                        fill="#e6ebe7"
                        stroke="#94a6a6"
                        strokeWidth=".4"
                      />
                      <path
                        d="M-12 -18V18M12 -18V18M-22 -8H-12M-22 2H-12M12 -6H22M12 6H22M-12 9H12"
                        stroke="#a4b2b0"
                        strokeWidth=".4"
                      />
                      {zones
                        .filter(
                          (z) =>
                            layoutFor(db.dealership).waitingRoom ||
                            z.id !== "attente",
                        )
                        .map((z) => (
                          <g
                            key={z.id}
                            onClick={() => go(z.id)}
                            tabIndex={0}
                            role="button"
                            aria-label={"Aller à " + z.short}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") go(z.id);
                            }}
                          >
                            <circle
                              cx={z.x}
                              cy={z.z}
                              r="2.8"
                              fill={zone === z.id ? "#477996" : "#c2cfca"}
                            />
                            <text
                              x={z.x}
                              y={z.z + 0.8}
                              textAnchor="middle"
                              fontSize="1.9"
                              fill={zone === z.id ? "white" : "#314b56"}
                            >
                              {z.short.slice(0, 3)}
                            </text>
                          </g>
                        ))}
                      {mode === "walk" && (
                        <circle
                          cx={pos[0]}
                          cy={pos[1]}
                          r=".9"
                          fill="#1f6593"
                          stroke="white"
                          strokeWidth=".5"
                        />
                      )}
                    </svg>
                  </div>
                </div>
                <div className="scene-footer">
                  <span>
                    <span className="dot" />{" "}
                    {hint ||
                      "Glissez pour explorer · pincez pour zoomer · touchez une zone ou un véhicule."}
                  </span>
                  <span>Véhicules illustratifs · navigation guidée</span>
                </div>
              </section>
              <aside
                key={`${selection?.kind || "none"}-${selection?.id || ""}-${fullDossier}`}
                className="context-panel"
              >
                {selection?.kind === "zone" ||
                selection?.kind === "inventory" ? (
                  <GuidedContext
                    db={db}
                    selection={selection}
                    onSelect={select}
                    onView={setView}
                    onReception={() => setCreation(true)}
                    onClose={() => {
                      setSelection(null);
                      changeMode("overview");
                    }}
                  />
                ) : selection?.kind === "customer" && car ? (
                  <ClientContext
                    db={db}
                    vehicle={car}
                    onVehicle={() => select({ kind: "vehicle", id: car.id })}
                    onQuotes={() => setView("devis")}
                    onClose={() => {
                      setSelection(null);
                      changeMode("overview");
                    }}
                  />
                ) : car && !fullDossier ? (
                  <VehicleSummary
                    db={db}
                    vehicle={car}
                    onDetails={() => setFullDossier(true)}
                    onClose={() => {
                      setSelection(null);
                      changeMode("overview");
                    }}
                  />
                ) : car ? (
                  <>
                    <div className="panel-top">
                      <span>
                        {selection?.kind === "customer"
                          ? "DOSSIER CLIENT"
                          : "DOSSIER VÉHICULE"}
                      </span>
                      <button
                        className="icon-button"
                        aria-label="Fermer le dossier"
                        onClick={() => {
                          scene.current?.inspect(car.id, false);
                          setSelection(null);
                          setInspect(false);
                          changeMode("overview");
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="vehicle-heading">
                      <span className="model-honesty">
                        Illustration générique · modèle exact non importé
                      </span>
                      <div
                        className="car-avatar"
                        style={{ background: car.color }}
                      >
                        <Car size={34} color="white" />
                      </div>
                      <h2>
                        {selection?.kind === "customer"
                          ? car.client
                          : `${car.make} ${car.model}`}
                      </h2>
                      <p className="warning-small">
                        Représentation 3D générique · modèle exact non importé.
                      </p>
                      <span className="plate">{car.plate}</span>
                      <Badge status={car.status} />
                    </div>
                    <div className="panel-tabs">
                      {[
                        ["dossier", "Dossier"],
                        ["pieces", "Pièces 3D"],
                        ["historique", "Activité"],
                      ].map(([id, label]) => (
                        <button
                          className={tab === id ? "on" : ""}
                          key={id}
                          onClick={() => {
                            setTab(id);
                            if (id === "pieces") {
                              setInspect(true);
                              scene.current?.inspect(car.id, true);
                              setMode("free");
                            }
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="panel-body">
                      {tab === "dossier" ? (
                        <>
                          {!isPresent(car) && (
                            <div className="subtle-note">
                              Véhicule hors du garage : le dossier reste
                              consultable.
                            </div>
                          )}
                          {car.present === false &&
                            car.status === "Réception" && (
                              <button
                                className="primary full"
                                onClick={() =>
                                  commit(
                                    (d) => ({
                                      ...updateVehicle(d, car.id, {
                                        present: true,
                                        arrivedAt: new Date().toISOString(),
                                      }),
                                      appointments: d.appointments?.map((a) =>
                                        a.vehicle === car.id
                                          ? { ...a, arrived: true }
                                          : a,
                                      ),
                                    }),
                                    "Arrivée enregistrée.",
                                  )
                                }
                              >
                                Enregistrer l’arrivée
                              </button>
                            )}
                          <div className="guided-item">
                            <strong>
                              {selection?.kind === "customer"
                                ? car.client
                                : "Situation du client"}
                            </strong>
                            <span>
                              {car.status === "Prêt à livrer"
                                ? "Restitution possible · contrôle validé"
                                : car.status}
                            </span>
                            {(db.quotes || [])
                              .filter((q) => q.vehicle === car.id)
                              .sort(
                                (a, b) => Date.parse(b.at) - Date.parse(a.at),
                              )
                              .slice(0, 1)
                              .map((q) => (
                                <div key={q.id}>
                                  <strong>
                                    Dernier devis : {q.state} ·{" "}
                                    {euro(quoteTotals(q).total)} TTC
                                  </strong>
                                  <small>
                                    {q.state === "Validé"
                                      ? "Accord client enregistré"
                                      : "Accord client attendu"}
                                  </small>
                                </div>
                              ))}
                            {!(db.quotes || []).some(
                              (q) => q.vehicle === car.id,
                            ) && <small>Aucun devis enregistré</small>}
                            <button
                              className="secondary full"
                              onClick={() => setView("devis")}
                            >
                              Consulter les devis
                            </button>
                          </div>
                          <ol
                            className="client-progress"
                            aria-label="Parcours du dossier"
                          >
                            {statuses.map((status) => (
                              <li
                                key={status}
                                aria-current={
                                  status === car.status ? "step" : undefined
                                }
                              >
                                {status}
                              </li>
                            ))}
                          </ol>
                          <div className="client-line">
                            <Users size={20} />
                            <div>
                              <strong>{car.client}</strong>
                              <small>{car.phone}</small>
                            </div>
                          </div>
                          <div className="vehicle-facts">
                            <div>
                              <span>Kilométrage</span>
                              <strong>
                                {car.km.toLocaleString("fr-FR")} km
                              </strong>
                            </div>
                            <div>
                              <span>Année</span>
                              <strong>{car.year}</strong>
                            </div>
                          </div>
                          <DeliveryDeadline db={db} vehicle={car} />
                          <label>Motif de visite</label>
                          <p className="symptoms">{car.symptoms}</p>
                          <label htmlFor="technician">Technicien affecté</label>
                          <select
                            id="technician"
                            value={car.technician}
                            onChange={(e) =>
                              commit(
                                (d) =>
                                  updateVehicle(d, car.id, {
                                    technician: e.target.value,
                                  }),
                                "Affectation sauvegardée.",
                              )
                            }
                          >
                            {technicians.map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                          <label htmlFor="bay">Poste de travail</label>
                          <select
                            id="bay"
                            value={car.bay ?? ""}
                            onChange={(e) =>
                              commit(
                                (d) =>
                                  updateVehicle(d, car.id, {
                                    bay: e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  }),
                                "Poste sauvegardé.",
                              )
                            }
                          >
                            <option value="">Sans poste</option>
                            {Array.from({ length: 8 }, (_, i) => (
                              <option key={i} value={i + 1}>
                                Poste {i + 1}
                                {db.vehicles.some(
                                  (v) => v.id !== car.id && v.bay === i + 1,
                                )
                                  ? " · occupé"
                                  : ""}
                              </option>
                            ))}
                          </select>
                          <label htmlFor="status">
                            Statut de l’intervention
                          </label>
                          <select
                            id="status"
                            value={car.status}
                            onChange={(e) =>
                              commit(
                                (d) =>
                                  updateVehicle(d, car.id, {
                                    status: e.target.value as Status,
                                  }),
                                "Statut mis à jour.",
                              )
                            }
                          >
                            {statuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                          <label className="check-label">
                            <input
                              type="checkbox"
                              checked={car.quality}
                              onChange={(e) =>
                                commit(
                                  (d) =>
                                    updateVehicle(d, car.id, {
                                      quality: e.target.checked,
                                    }),
                                  "Contrôle qualité sauvegardé.",
                                )
                              }
                            />
                            Contrôle qualité validé
                          </label>
                          <button
                            className="secondary full"
                            onClick={() => setView("atelier")}
                          >
                            <Wrench size={18} />
                            Ouvrir le mode atelier
                          </button>
                          <label htmlFor="notes">Notes atelier</label>
                          <textarea
                            id="notes"
                            key={car.id}
                            defaultValue={car.notes}
                            onBlur={(e) => {
                              if (e.target.value !== car.notes)
                                commit(
                                  (d) =>
                                    updateVehicle(d, car.id, {
                                      notes: e.target.value,
                                    }),
                                  "Notes sauvegardées.",
                                );
                            }}
                            placeholder="Mesures, réparations, observations…"
                          />
                          <button
                            className="primary full"
                            onClick={() => {
                              setView("intelligence");
                              setDiagnosis(car.symptoms + " " + car.codes);
                              setSearched(true);
                            }}
                          >
                            <Brain size={18} />
                            Rechercher des cas similaires
                          </button>
                          {car.status === "Devis à valider" && (
                            <button
                              className="secondary full"
                              onClick={() => prepareMessage(car, "quote")}
                            >
                              <Envelope size={18} />
                              Préparer WhatsApp · devis
                            </button>
                          )}
                          {car.status === "Prêt à livrer" && (
                            <button
                              className="secondary full"
                              onClick={() => prepareMessage(car)}
                            >
                              <Envelope size={18} />
                              Préparer WhatsApp · restitution
                            </button>
                          )}
                        </>
                      ) : tab === "pieces" ? (
                        <>
                          <div className="subtle-note">
                            <Eye size={19} />
                            Illustration mécanique générique : roue avant gauche
                            retirée visuellement. Cliquez sur le disque ou
                            l’étrier dans la scène.
                          </div>
                          <button
                            className="secondary full"
                            onClick={() => {
                              setInspect(!inspect);
                              scene.current?.inspect(car.id, !inspect);
                            }}
                          >
                            <Wrench size={18} />
                            {inspect
                              ? "Remonter la roue"
                              : "Inspecter le freinage"}
                          </button>
                          <div className="parts-selector">
                            {db.parts
                              .filter((p) =>
                                ["disc", "pads", "caliper"].includes(p.id),
                              )
                              .map((p) => (
                                <button
                                  className={selectedPart === p.id ? "on" : ""}
                                  key={p.id}
                                  onClick={() => setSelectedPart(p.id)}
                                >
                                  {p.name}
                                </button>
                              ))}
                          </div>
                          {db.parts
                            .filter((p) => p.id === selectedPart)
                            .map((p) => (
                              <div className="part-detail" key={p.id}>
                                <span className="eyebrow">
                                  FREINAGE · AVANT GAUCHE
                                </span>
                                <h3>{p.name}</h3>
                                <code>{p.ref}</code>
                                <div className="vehicle-facts">
                                  <div>
                                    <span>Disponibles</span>
                                    <strong>
                                      {p.stock - p.reserved} unités
                                    </strong>
                                  </div>
                                  <div>
                                    <span>Emplacement</span>
                                    <strong>{p.location}</strong>
                                  </div>
                                </div>
                                <p className="warning-small">
                                  Référence et prix fictifs. Compatibilité VIN /
                                  OEM à confirmer avant toute utilisation
                                  réelle.
                                </p>
                                <strong className="part-price">
                                  {euro(p.price)} <small>prix démo HT</small>
                                </strong>
                                <button
                                  className="primary full"
                                  disabled={
                                    car.parts.includes(p.id) ||
                                    p.stock - p.reserved === 0
                                  }
                                  onClick={() =>
                                    commit(
                                      (d) => reservePart(d, car.id, p.id),
                                      "Pièce réservée pour ce véhicule.",
                                    )
                                  }
                                >
                                  <Package size={17} />
                                  {car.parts.includes(p.id)
                                    ? "Déjà réservée"
                                    : "Réserver pour ce dossier"}
                                </button>
                                <button
                                  className="secondary full"
                                  onClick={() =>
                                    commit(
                                      (d) =>
                                        record(
                                          {
                                            ...d,
                                            orders: [
                                              {
                                                id: crypto.randomUUID(),
                                                part: p.id,
                                                quantity: 1,
                                                status: "À valider",
                                                at: new Date().toISOString(),
                                              },
                                              ...d.orders,
                                            ],
                                          },
                                          car.id,
                                          "Commande préparée : " + p.name,
                                        ),
                                      "Commande préparée · validation requise, aucun envoi.",
                                    )
                                  }
                                >
                                  <Plus size={17} />
                                  Préparer une commande
                                </button>
                              </div>
                            ))}
                        </>
                      ) : (
                        <>
                          <h3>Journal du dossier</h3>
                          <div className="timeline">
                            {db.audit.filter((a) => a.vehicle === car.id)
                              .length ? (
                              db.audit
                                .filter((a) => a.vehicle === car.id)
                                .map((a) => (
                                  <div key={a.id}>
                                    <i />
                                    <strong>{a.action}</strong>
                                    <small>
                                      {new Date(a.at).toLocaleString("fr-FR")}
                                    </small>
                                  </div>
                                ))
                            ) : (
                              <p>Aucune modification enregistrée.</p>
                            )}
                          </div>
                          {db.messages
                            .filter((m) => m.vehicle === car.id)
                            .map((m) => (
                              <div className="message" key={m.id}>
                                <span>
                                  WHATSAPP · BROUILLON À RELIRE · NON ENVOYÉ
                                </span>
                                <p>{m.text}</p>
                                <button
                                  className="secondary"
                                  onClick={() =>
                                    navigator.clipboard
                                      .writeText(m.text)
                                      .then(() => notify("Brouillon copié."))
                                      .catch(() =>
                                        notify(
                                          "Copie indisponible : sélectionnez le texte.",
                                        ),
                                      )
                                  }
                                >
                                  Copier le message
                                </button>
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  </>
                ) : selection?.kind === "bay" ? (
                  <>
                    <div className="panel-top">
                      <span>POSTE DE TRAVAIL</span>
                      <button
                        className="icon-button"
                        onClick={() => setSelection(null)}
                        aria-label="Fermer"
                      >
                        <X />
                      </button>
                    </div>
                    <div className="panel-body">
                      <Wrench size={40} />
                      <h2>Pont {selection.id.padStart(2, "0")}</h2>
                      <p>
                        {db.vehicles.find((v) => v.bay === Number(selection.id))
                          ?.plate || "Poste disponible"}
                      </p>
                      <button
                        className="primary full"
                        onClick={() =>
                          scene.current?.lift(Number(selection.id))
                        }
                      >
                        Lever / abaisser le pont
                      </button>
                      <p className="warning-small">
                        Animation de démonstration, sans commande d’équipement
                        réel.
                      </p>
                      {db.vehicles
                        .filter((v) => v.bay === Number(selection.id))
                        .map((v) => (
                          <button
                            className="secondary full"
                            key={v.id}
                            onClick={() =>
                              select({ kind: "vehicle", id: v.id })
                            }
                          >
                            Ouvrir le dossier
                            <ArrowRight />
                          </button>
                        ))}
                    </div>
                  </>
                ) : selection?.kind === "technician" ? (
                  <>
                    <div className="panel-top">
                      <span>TECHNICIEN</span>
                      <button
                        aria-label="Fermer"
                        className="icon-button"
                        onClick={() => setSelection(null)}
                      >
                        <X />
                      </button>
                    </div>
                    <div className="panel-body">
                      <div className="large-avatar">
                        {selection.id
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                      <h2>{selection.id}</h2>
                      <p>Interventions affectées</p>
                      {db.vehicles
                        .filter(
                          (v) =>
                            v.technician === selection.id &&
                            v.status !== "Livré",
                        )
                        .map((v) => (
                          <button
                            className="vehicle-row"
                            key={v.id}
                            onClick={() =>
                              select({ kind: "vehicle", id: v.id })
                            }
                          >
                            <Car />
                            <span>
                              <strong>
                                {v.make} {v.model}
                              </strong>
                              <small>{v.plate}</small>
                            </span>
                            <Badge status={v.status} />
                          </button>
                        ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="panel-top">
                      <strong>L’atelier aujourd’hui</strong>
                      <span className="small-chip">
                        {active.length} véhicules
                      </span>
                    </div>
                    <div className="activity-intro">
                      <span className="eyebrow">TOUT EST À PORTÉE DE MAIN</span>
                      <h2>
                        Chaque voiture
                        <br />a son histoire.
                      </h2>
                      <p>
                        Ouvrez un dossier depuis l’atelier ou retrouvez un
                        véhicule ci-dessous.
                      </p>
                    </div>
                    <div className="search">
                      <MagnifyingGlass size={18} />
                      <input
                        aria-label="Rechercher un véhicule"
                        placeholder="Plaque, client, véhicule…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <div className="vehicle-list">
                      {visible.filter(isPresent).map((v) => (
                        <button
                          className="vehicle-preview"
                          key={v.id}
                          onClick={() => select({ kind: "vehicle", id: v.id })}
                        >
                          <span
                            className="preview-color"
                            style={{ background: v.color }}
                          >
                            <Car size={23} />
                          </span>
                          <div>
                            <strong>
                              {v.make} {v.model}
                            </strong>
                            <small>
                              {v.plate}{" "}
                              <span>
                                ·{" "}
                                {v.bay
                                  ? "Poste " + v.bay
                                  : v.status === "Prêt à livrer"
                                    ? "Livraison"
                                    : "Parking"}
                              </span>
                            </small>
                            <Badge status={v.status} />
                          </div>
                          <ArrowUpRight size={17} />
                        </button>
                      ))}
                      {!visible.length && (
                        <p className="empty">Aucun dossier trouvé.</p>
                      )}
                    </div>
                    <div className="panel-bottom">
                      <Clock size={18} />
                      <span>
                        Les modifications sont enregistrées en base
                        <br />
                        sur le serveur AutoHub de ce Mac.
                      </span>
                    </div>
                  </>
                )}
              </aside>
            </div>
          ) : view === "atelier" ? (
            <Workshop
              db={db}
              selected={selection?.kind === "vehicle" ? selection.id : null}
              onSelect={(id) =>
                setSelection(id ? { kind: "vehicle", id } : null)
              }
              commit={commit}
              onAction={(type, payload) =>
                transact(
                  type,
                  selection?.id,
                  payload,
                  "Action atelier enregistrée en base.",
                )
              }
              onOpen3D={(id) => {
                setSelection({ kind: "vehicle", id });
                setTab("dossier");
                setView("garage");
              }}
            />
          ) : view === "bibliotheque" ? (
            <AssetLibrary db={db} commit={commit} />
          ) : view === "devis" ? (
            <Quotes db={db} commit={commit} initialVehicle={car?.id} />
          ) : view === "dossiers" ? (
            <section className="content-card">
              <div className="section-head">
                <h2>
                  Clients & véhicules <span>{db.vehicles.length}</span>
                </h2>
                <div className="search">
                  <MagnifyingGlass />
                  <input
                    placeholder="Plaque, nom, modèle ou téléphone…"
                    aria-label="Recherche globale"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Véhicule</th>
                      <th>Client</th>
                      <th>Statut</th>
                      <th>Technicien</th>
                      <th>Poste</th>
                      <th>Fin prévue</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <strong>
                            {v.make} {v.model}
                          </strong>
                          <small>
                            {v.plate} · {v.km.toLocaleString("fr-FR")} km
                          </small>
                        </td>
                        <td>
                          {v.client}
                          <small>{v.phone}</small>
                        </td>
                        <td>
                          <Badge status={v.status} />
                        </td>
                        <td>{v.technician}</td>
                        <td>{v.bay ? String(v.bay).padStart(2, "0") : "—"}</td>
                        <td>
                          <DeliveryDeadline db={db} vehicle={v} />
                        </td>
                        <td>
                          <button
                            className="text-button"
                            onClick={() => {
                              setView("garage");
                              select({ kind: "vehicle", id: v.id });
                            }}
                          >
                            Dossier
                            <ArrowUpRight />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!visible.length && <p className="empty">Aucun résultat.</p>}
            </section>
          ) : view === "planning" ? (
            <Planning db={db} commit={commit} onOpen={openDossier} />
          ) : view === "stocks" ? (
            <Stocks db={db} commit={commit} />
          ) : view === "intelligence" ? (
            <Intelligence
              initialVehicle={selection?.id}
              db={db}
              onOpen={openDossier}
              commit={commit}
              onAction={(id, type, payload) =>
                transact(type, id, payload, "Diagnostic enregistré.")
              }
            />
          ) : view === "equipe" ? (
            <Team db={db} onOpen={openDossier} />
          ) : view === "pilotage" ? (
            <Pilotage
              db={db}
              onAction={(id, type, payload) =>
                transact(type, id, payload, "Décision enregistrée.")
              }
              commit={commit}
              onOpen={openDossier}
              onFilter={filterDossiers}
              onView={setView}
            />
          ) : (
            <section className="content-card settings">
              <h2>Votre concession</h2>
              <p>
                Maquette inspirée de Porto : showroom en façade, atelier au
                fond, ponts à droite et parc à gauche. Adaptez les enseignes et
                la salle d’attente à votre garage.
              </p>
              {(["leftBrand", "rightBrand"] as const).map((field, i) => (
                <label key={field}>
                  {i === 0 ? "Showroom gauche" : "Showroom droit"}
                  <input
                    key={layoutFor(db.dealership)[field]}
                    maxLength={40}
                    defaultValue={layoutFor(db.dealership)[field]}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value && value !== layoutFor(db.dealership)[field])
                        commit(
                          (d) => ({
                            ...d,
                            dealership: {
                              ...layoutFor(d.dealership),
                              [field]: value,
                            },
                          }),
                          "Enseigne enregistrée.",
                        );
                    }}
                  />
                </label>
              ))}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={layoutFor(db.dealership).waitingRoom}
                  onChange={(e) => {
                    const waitingRoom = e.target.checked;
                    commit(
                      (d) => ({
                        ...d,
                        dealership: { ...layoutFor(d.dealership), waitingRoom },
                      }),
                      "Plan de la concession enregistré.",
                    );
                  }}
                />
                Salle d’attente dans la maquette
              </label>
              <label>
                Profondeur de l’atelier
                <select
                  value={db.dealership?.workshopSpacing || 5}
                  onChange={(e) => {
                    const workshopSpacing = Number(e.target.value);
                    commit(
                      (d) => ({
                        ...d,
                        dealership: {
                          ...layoutFor(d.dealership),
                          workshopSpacing,
                        },
                      }),
                      "Dimensions de la maquette enregistrées.",
                    );
                  }}
                >
                  <option value={5}>Standard · ponts espacés de 5 m</option>
                  <option value={6}>
                    Grand atelier · ponts espacés de 6 m
                  </option>
                  <option value={7}>
                    Très grand atelier · ponts espacés de 7 m
                  </option>
                </select>
              </label>
              <h2>Préférences de navigation</h2>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={reduced}
                  onChange={(e) => setReduced(e.target.checked)}
                />
                Réduire les mouvements automatiques de caméra
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={low}
                  onChange={(e) => setLow(e.target.checked)}
                />
                Qualité légère : ombres désactivées et résolution réduite
              </label>
              <h2>Vos données locales</h2>
              <p>
                Les dossiers et la configuration sont enregistrés sur le serveur
                AutoHub de ce Mac. Exportez régulièrement une sauvegarde.
              </p>
              <button className="secondary" onClick={exportDB}>
                <Export size={18} />
                Exporter tous les dossiers
              </button>
              {localStorage.getItem("autohub-local-v1") && (
                <button
                  className="secondary"
                  onClick={() => {
                    const raw = localStorage.getItem("autohub-local-v1");
                    if (raw) {
                      const url = URL.createObjectURL(
                        new Blob([raw], { type: "application/json" }),
                      );
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "autohub-ancienne-version-0.2.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  Exporter la sauvegarde 0.2 conservée dans ce navigateur
                </button>
              )}
              <label className="import-label">
                Restaurer une sauvegarde JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const incoming = loadDB(await file.text());
                      if (
                        window.confirm(
                          "Remplacer les dossiers locaux par cette sauvegarde ?",
                        )
                      ) {
                        setCanSave(true);
                        await transact(
                          "import",
                          undefined,
                          { db: incoming },
                          "Sauvegarde restaurée sur le serveur.",
                        );
                        setSelection(null);
                        notify("Sauvegarde restaurée.");
                      }
                    } catch {
                      notify("Fichier invalide ou incompatible.");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                className="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Réinitialiser tous les dossiers locaux avec les données fictives ?",
                    )
                  ) {
                    setCanSave(true);
                    transact(
                      "reset",
                      undefined,
                      {},
                      "Démonstration V2 réinitialisée.",
                    );
                    setSelection(null);
                    notify("Démonstration réinitialisée.");
                  }
                }}
              >
                <ArrowCounterClockwise size={17} />
                Réinitialiser la démonstration
              </button>
              <h2>Fonctions à connecter</h2>
              <p>
                Identification VIN, modèles GLB sous licence, diagnostic IA,
                fournisseurs, messagerie, facturation réglementaire et
                authentification multi-garages : ces intégrations ne sont pas
                activées dans cette version.
              </p>
            </section>
          )}
          <footer className="app-footer">
            <span>
              AutoHub 3D <span>·</span> Version V2 · synchronisée
            </span>
            <span>
              <ShieldCheck size={14} />
              Données fictives · base SQLite sur ce Mac
            </span>
          </footer>
        </main>
      </div>
      {creation && (
        <Reception
          db={db}
          onExisting={(id) => {
            setCreation(false);
            setView("garage");
            select({ kind: "vehicle", id });
          }}
          onClose={() => setCreation(false)}
          onCreate={async (v) => {
            const duplicate = duplicateVehicle(db, v);
            if (duplicate) {
              notify(
                "Ce véhicule existe déjà : " +
                  duplicate.plate +
                  ". Ouvrez son dossier, sans fusion automatique.",
              );
              return;
            }
            if (v.vin && !validVIN(v.vin)) {
              notify("Vérifiez le VIN : 17 caractères sans I, O ou Q.");
              return;
            }
            const parked = db.vehicles.filter(
              (c) =>
                c.bay === null &&
                c.present !== false &&
                !["Prêt à livrer", "Livré"].includes(c.status),
            );
            if (parked.length >= 8) {
              notify(
                "Le parking de démonstration est complet (8 places). Affectez un véhicule à un poste ou livrez-le.",
              );
              return;
            }
            const saved = await commit(
              (d) =>
                record(
                  { ...d, vehicles: [...d.vehicles, v] },
                  v.id,
                  "Réception créée",
                ),
              "Véhicule réceptionné, dossier sauvegardé.",
            );
            if (!saved) return;
            setCreation(false);
            setView("garage");
            select({ kind: "vehicle", id: v.id });
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={20} />
          {toast}
          <button
            aria-label="Fermer la notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function Reception({
  onClose,
  onCreate,
  db,
  onExisting,
}: {
  onClose: () => void;
  onCreate: (v: Vehicle) => void;
  db: DB;
  onExisting: (id: string) => void;
}) {
  const [scanOpen, setScanOpen] = useState(false);
  const [scanEvidence, setScanEvidence] = useState<FieldEvidence[]>([]);
  const [identification, setIdentification] = useState<ReturnType<
    typeof identifyLocal
  > | null>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = Array.from(
          form.current?.querySelectorAll<HTMLElement>(
            "input,select,textarea,button",
          ) || [],
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        ref={form}
        className={"modal " + (scanOpen ? "scan-open" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reception-title"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const get = (k: string) => String(data.get(k) || "").trim();
          onCreate({
            id: crypto.randomUUID(),
            client: get("client"),
            phone: get("phone"),
            email: get("email"),
            make: get("make"),
            model: get("model"),
            plate: get("plate").toUpperCase(),
            country: get("country"),
            vin: get("vin").toUpperCase(),
            registrationEvidence: scanEvidence,
            year: Number(get("year")),
            km: Number(get("km")),
            shape: get("shape") as Vehicle["shape"],
            color: "#607d8a",
            symptoms: get("symptoms"),
            codes: get("codes"),
            status: "Réception",
            technician: "Non affecté",
            bay: null,
            due: get("due"),
            quality: false,
            present: true,
            arrivedAt: new Date().toISOString(),
            estimatedMinutes: 60,
            notes: "",
            parts: [],
          });
        }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">ACCUEIL · NOUVEAU DOSSIER</span>
            <h2 id="reception-title">Réceptionner un véhicule</h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            className="icon-button"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        <p>
          Créez le dossier client et l’intervention. Le véhicule apparaîtra au
          parking, puis pourra être affecté à un poste.
        </p>
        <div className="reception-tools">
          <button
            type="button"
            className="secondary"
            onClick={() => setScanOpen(!scanOpen)}
          >
            <Scan size={19} />
            Scanner une carte grise
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              const data = new FormData(form.current!);
              setIdentification(
                identifyLocal(db, {
                  plate: String(data.get("plate") || ""),
                  vin: String(data.get("vin") || ""),
                  country: String(data.get("country") || "FR"),
                }),
              );
            }}
          >
            Retrouver dans les dossiers
          </button>
        </div>
        {identification && (
          <div className="identification-result">
            <strong>{identification.source}</strong>
            <p>{identification.message}</p>
            {identification.matches.map((v) => (
              <button
                type="button"
                key={v.id}
                className="secondary"
                onClick={() => onExisting(v.id)}
              >
                Ouvrir {v.make} {v.model} · {v.plate}
              </button>
            ))}
          </div>
        )}
        {scanOpen && (
          <ScanPanel
            onClose={() => setScanOpen(false)}
            onApply={(fields) => {
              const mapping: Record<string, string> = {
                A: "plate",
                "D.1": "make",
                "D.3": "model",
                E: "vin",
              };
              for (const field of fields) {
                const name = mapping[field.code];
                if (name) {
                  const input = form.current?.elements.namedItem(
                    name,
                  ) as HTMLInputElement | null;
                  if (input) input.value = field.value;
                }
              }
              const yearField = fields.find((f) => f.code === "B");
              if (yearField) {
                const year = yearField.value.match(/(?:19|20)\d{2}/)?.[0];
                if (year)
                  (
                    form.current!.elements.namedItem("year") as HTMLInputElement
                  ).value = year;
              }
              (
                form.current!.elements.namedItem("country") as HTMLSelectElement
              ).value = "FR";
              setScanEvidence(fields);
              setScanOpen(false);
            }}
          />
        )}
        <div className="form-grid">
          <label>
            Pays d’immatriculation
            <select name="country">
              <option value="FR">France</option>
              <option value="PT">Portugal</option>
              <option value="ES">Espagne</option>
            </select>
          </label>
          <label>
            VIN facultatif
            <input
              name="vin"
              maxLength={17}
              placeholder="17 caractères · aucun lookup externe"
            />
          </label>
          <label>
            Nom du client
            <input
              autoFocus
              name="client"
              required
              placeholder="Prénom et nom"
              maxLength={120}
            />
          </label>
          <label>
            Téléphone
            <input
              name="phone"
              required
              type="tel"
              placeholder="06…"
              maxLength={30}
            />
          </label>
          <label>
            E-mail
            <input name="email" type="email" placeholder="Facultatif" />
          </label>
          <label>
            Immatriculation
            <input
              name="plate"
              required
              maxLength={20}
              placeholder="AB-123-CD"
            />
          </label>
          <label>
            Marque
            <input
              name="make"
              required
              maxLength={60}
              placeholder="BMW, Renault…"
            />
          </label>
          <label>
            Modèle
            <input
              name="model"
              required
              maxLength={80}
              placeholder="Série 3, Clio…"
            />
          </label>
          <label>
            Année
            <input
              name="year"
              type="number"
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              defaultValue="2020"
            />
          </label>
          <label>
            Kilométrage
            <input
              name="km"
              type="number"
              required
              min="0"
              max="2000000"
              defaultValue="80000"
            />
          </label>
          <label>
            Carrosserie
            <select name="shape">
              <option value="sedan">Berline</option>
              <option value="hatch">Compacte</option>
              <option value="suv">SUV</option>
            </select>
          </label>
          <label>
            Fin prévue
            <input name="due" type="time" required defaultValue="17:00" />
          </label>
        </div>
        <label>
          Motif de visite et symptômes
          <textarea
            name="symptoms"
            required
            maxLength={3000}
            placeholder="Décrivez la demande du client…"
          />
        </label>
        <label>
          Codes défauts
          <input
            name="codes"
            placeholder="Facultatif · P0299, P0562…"
            maxLength={500}
          />
        </label>
        <div className="modal-bottom">
          <span>
            <FloppyDisk size={16} />
            Sauvegarde locale
          </span>
          <button className="primary" type="submit">
            <Plus size={18} />
            Créer la réception
          </button>
        </div>
      </form>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

````

## src/navigation.ts

````typescript
export type Box = { x: number; z: number; w: number; d: number };
export const walls: Box[] = [];
function divided(
  axis: "x" | "z",
  constant: number,
  start: number,
  end: number,
  doors: number[],
) {
  let last = start;
  for (const opening of doors) {
    const lo = opening - 1.5;
    if (lo > last)
      walls.push(
        axis === "x"
          ? { x: constant, z: (last + lo) / 2, w: 0.25, d: lo - last }
          : { x: (last + lo) / 2, z: constant, w: lo - last, d: 0.25 },
      );
    last = opening + 1.5;
  }
  if (last < end)
    walls.push(
      axis === "x"
        ? { x: constant, z: (last + end) / 2, w: 0.25, d: end - last }
        : { x: (last + end) / 2, z: constant, w: end - last, d: 0.25 },
    );
}
divided("x", -22, -52, 18, []);
divided("x", 22, -52, 18, []);
divided("z", -52, -22, 22, []);
divided("z", -18, -22, -12, [-17]);
divided("z", -18, 12, 22, [17]);
divided("z", 18, -22, 22, [0, 17]);
divided("x", -12, -18, 18, [-13, -3, 10]);
divided("x", 12, -18, 18, [-12, 0, 12]);
divided("z", -8, -22, -12, [-17]);
divided("z", 2, -22, -12, [-17]);
divided("z", -6, 12, 22, [17]);
divided("z", 6, 12, 22, [17]);
divided("z", 9, -12, 12, [0]);
export const doors = [
  { id: "d1", x: -12, z: 10, axis: "x" },
  { id: "d2", x: 12, z: -12, axis: "x" },
  { id: "d3", x: 12, z: 0, axis: "x" },
  { id: "d4", x: 12, z: 12, axis: "x" },
];
export function blocked(
  x: number,
  z: number,
  boxes: Box[],
  radius = 0.38,
  depth = 52,
) {
  return (
    x < -21.5 ||
    x > 21.5 ||
    z < -depth + 0.5 ||
    z > 29 ||
    boxes.some(
      (b) =>
        Math.abs(x - b.x) < b.w / 2 + radius &&
        Math.abs(z - b.z) < b.d / 2 + radius,
    )
  );
}
/** Grid A* with clearance; cardinal moves avoid cutting wall corners. */
export function findPath(
  from: [number, number],
  to: [number, number],
  boxes: Box[],
  depth = 52,
): [number, number][] {
  const start = from.map(Math.round) as [number, number];
  const end = to.map(Math.round) as [number, number];
  const key = (p: number[]) => p.join(",");
  const open = [start],
    parents = new Map<string, [number, number]>(),
    cost = new Map([[key(start), 0]]),
    seen = new Set<string>();
  while (open.length) {
    open.sort(
      (a, b) =>
        cost.get(key(a))! +
        Math.abs(a[0] - end[0]) +
        Math.abs(a[1] - end[1]) -
        (cost.get(key(b))! + Math.abs(b[0] - end[0]) + Math.abs(b[1] - end[1])),
    );
    const p = open.shift()!;
    const k = key(p);
    if (seen.has(k)) continue;
    seen.add(k);
    if (k === key(end)) {
      const route: [number, number][] = [end];
      let node = end;
      while (key(node) !== key(start)) {
        node = parents.get(key(node))!;
        route.unshift(node);
      }
      return route;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n: [number, number] = [p[0] + dx, p[1] + dz];
      if (blocked(...n, boxes, 0.45, depth)) continue;
      const nk = key(n),
        g = cost.get(k)! + 1;
      if (g < (cost.get(nk) ?? Infinity)) {
        cost.set(nk, g);
        parents.set(nk, p);
        open.push(n);
      }
    }
  }
  return [];
}

/** A viewpoint may coincide with a parked car: walk to the nearest clear spot. */
export function nearestWalkable(
  to: [number, number],
  boxes: Box[],
  depth = 52,
): [number, number] | null {
  const origin = to.map(Math.round) as [number, number];
  for (let radius = 0; radius <= 4; radius++) {
    const candidates: [number, number][] = [];
    for (let dx = -radius; dx <= radius; dx++)
      for (let dz = -radius; dz <= radius; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) === radius)
          candidates.push([origin[0] + dx, origin[1] + dz]);
      }
    candidates.sort(
      (a, b) =>
        Math.hypot(a[0] - to[0], a[1] - to[1]) -
        Math.hypot(b[0] - to[0], b[1] - to[1]),
    );
    const point = candidates.find((p) => !blocked(...p, boxes, 0.45, depth));
    if (point) return point;
  }
  return null;
}

````

## src/persistence.ts

````typescript
import type { DB } from "./domain.ts";
export const STORAGE_KEY = "autohub-local-v2";
export function persistDB(
  db: DB,
  storage: { setItem: (key: string, value: string) => void },
) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    throw Error(
      "Sauvegarde locale impossible : espace insuffisant ou stockage bloqué. La modification a été refusée ; exportez les dossiers avant de continuer.",
    );
  }
}

````

## src/planning-domain.ts

````typescript
import type { DB, Vehicle } from "./domain.ts";
import { record, updateVehicle } from "./domain.ts";
import { team, resources, departments, type Department } from "./team-data.ts";
export { team, resources, departments } from "./team-data.ts";
export type { Department, Technician } from "./team-data.ts";
export type Appointment = {
  id: string;
  vehicle: string;
  technician: string;
  resource: string;
  department: Department;
  start: string;
  duration: number;
  promised: string;
  priority: "Normale" | "Haute";
  requiredParts: string[];
  requiresQuote: boolean;
  state: "Planifié" | "En cours" | "En pause" | "Terminé";
  arrived: boolean;
};
export type PlanningAlert = {
  code: string;
  message: string;
  vehicle: string;
  appointment: string;
  blocking: boolean;
};
export function endAt(a: Appointment) {
  return new Date(Date.parse(a.start) + a.duration * 60000).toISOString();
}
export function overlaps(a: Appointment, b: Appointment) {
  return (
    Date.parse(a.start) < Date.parse(endAt(b)) &&
    Date.parse(b.start) < Date.parse(endAt(a))
  );
}
export function planningAlerts(
  db: DB,
  appointments = db.appointments || [],
  now = Date.now(),
): PlanningAlert[] {
  const alerts: PlanningAlert[] = [];
  for (const a of appointments.filter((a) => a.state !== "Terminé")) {
    const v = db.vehicles.find((v) => v.id === a.vehicle);
    const technician = team.find((t) => t.name === a.technician);
    const push = (code: string, message: string, blocking = false) =>
      alerts.push({
        code,
        message,
        vehicle: a.vehicle,
        appointment: a.id,
        blocking,
      });
    for (const b of appointments) {
      if (b.id === a.id || b.state === "Terminé" || !overlaps(a, b)) continue;
      if (a.technician === b.technician)
        push(
          "technician_conflict",
          `${a.technician} est déjà réservé sur ${db.vehicles.find((v) => v.id === b.vehicle)?.plate}.`,
          true,
        );
      if (a.resource === b.resource)
        push(
          "resource_conflict",
          `${resources.find((r) => r.id === a.resource)?.name || a.resource} est réservé deux fois.`,
          true,
        );
    }
    if (technician && !technician.skills.includes(a.department))
      push(
        "skill",
        `${a.technician} n’a pas la compétence ${a.department} enregistrée.`,
        true,
      );
    if (!a.arrived) push("not_arrived", "Véhicule non encore arrivé.");
    if (
      a.requiresQuote &&
      !(db.quotes || []).some(
        (q) => q.vehicle === a.vehicle && q.state === "Validé",
      )
    )
      push("quote", "Accord sur devis non enregistré.", true);
    for (const id of a.requiredParts) {
      const p = db.parts.find((p) => p.id === id);
      const held = v?.partReservations?.[id] || (v?.parts.includes(id) ? 1 : 0);
      if (p && p.stock - p.reserved + held < 1)
        push("part", `Pièce indisponible : ${p.name}.`, true);
    }
    if (a.duration < (v?.estimatedMinutes || 15))
      push("duration", "Durée inférieure à l’estimation enregistrée.");
    if (Date.parse(endAt(a)) > Date.parse(a.promised))
      push("promise", "Livraison promise avant la fin prévisionnelle.");
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(a.start));
    const endTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(endAt(a)));
    if (
      technician &&
      (time < technician.shiftStart ||
        endTime > technician.shiftEnd ||
        endAt(a).slice(0, 10) !== a.start.slice(0, 10))
    )
      push("hours", "Réservation hors des horaires enregistrés.");
    if (
      Date.parse(endAt(a)) < now &&
      ["En cours", "En pause"].includes(a.state)
    )
      push("late", "Fin prévue dépassée.");
    const concurrent = appointments.filter(
      (b) =>
        b.state !== "Terminé" &&
        b.department === a.department &&
        overlaps(a, b),
    );
    const capacity = resources.filter(
      (r) => r.department === a.department,
    ).length;
    if (capacity && concurrent.length > capacity)
      push("department", "Capacité du département dépassée.");
  }
  return alerts;
}
export function moveAppointment(
  db: DB,
  id: string,
  patch: Partial<Appointment>,
): DB {
  const old = db.appointments?.find((a) => a.id === id);
  if (!old) throw Error("Réservation introuvable.");
  if (old.state === "Terminé")
    throw Error("Une réservation terminée ne peut plus être déplacée.");
  const next = { ...old, ...patch, id: old.id, vehicle: old.vehicle };
  if (
    !Number.isFinite(next.duration) ||
    next.duration < 15 ||
    next.duration > 600 ||
    !Number.isFinite(Date.parse(next.start)) ||
    !Number.isFinite(Date.parse(next.promised)) ||
    !team.some((t) => t.name === next.technician) ||
    !resources.some((r) => r.id === next.resource)
  )
    throw Error("Réservation invalide.");
  const appointments = db.appointments!.map((a) => (a.id === id ? next : a));
  const blocking = planningAlerts(db, appointments).filter(
    (a) =>
      a.appointment === id &&
      ["resource_conflict", "technician_conflict", "skill"].includes(a.code),
  );
  if (blocking.length) throw Error(blocking[0].message);
  let updated: DB = { ...db, appointments };
  const vehicle = db.vehicles.find((v) => v.id === next.vehicle)!;
  if (next.state === "En cours") {
    const resource = resources.find((r) => r.id === next.resource)!;
    updated = updateVehicle(updated, vehicle.id, {
      technician: next.technician,
      bay: resource.bay,
    });
  } else
    updated = {
      ...updated,
      vehicles: updated.vehicles.map((v) =>
        v.id === next.vehicle ? { ...v, technician: next.technician } : v,
      ),
    };
  return record(
    updated,
    next.vehicle,
    "Planning modifié : " + next.technician + " · " + next.start,
  );
}
export function nextAvailable(db: DB, a: Appointment, notBefore = Date.now()) {
  let start = Math.max(Date.parse(a.start), notBefore);
  start = Math.ceil(start / (15 * 60000)) * 15 * 60000;
  for (let i = 0; i < 7 * 24 * 4; i++, start += 15 * 60000) {
    const candidate = { ...a, start: new Date(start).toISOString() };
    const others = (db.appointments || []).filter(
      (b) => b.id !== a.id && b.state !== "Terminé",
    );
    const hours = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(start));
    const endHours = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date(endAt(candidate)));
    const tech = team.find((t) => t.name === a.technician);
    if (
      !tech ||
      !tech.skills.includes(a.department) ||
      hours < tech.shiftStart ||
      endHours > tech.shiftEnd ||
      candidate.start.slice(0, 10) !== endAt(candidate).slice(0, 10)
    )
      continue;
    if (
      !others.some(
        (b) =>
          (b.technician === a.technician || b.resource === a.resource) &&
          overlaps(candidate, b),
      )
    )
      return candidate.start;
  }
  return null;
}

export function toCalendarInput(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(value))
    .replace(" ", "T");
}
export function fromCalendarInput(value: string) {
  const assumed = Date.parse(value + "Z");
  if (!Number.isFinite(assumed)) throw Error("Date invalide.");
  const offset =
    Date.parse(toCalendarInput(new Date(assumed).toISOString()) + "Z") -
    assumed;
  return new Date(assumed - offset).toISOString();
}

````

## src/quote-domain.ts

````typescript
import { prepareClientMessage } from "./communication-domain.ts";
import { record, updateVehicle, type DB, type Quote } from "./domain.ts";
export function quoteTotals(quote: Quote) {
  const ht = quote.lines.reduce(
    (sum, line) => sum + Math.round(line.quantity * line.unitPrice * 100) / 100,
    0,
  );
  const tax = Math.round(ht * quote.vat) / 100;
  return {
    ht: Math.round(ht * 100) / 100,
    tax,
    total: Math.round((ht + tax) * 100) / 100,
  };
}
export function saveQuote(db: DB, quote: Quote): DB {
  if (!db.vehicles.some((v) => v.id === quote.vehicle))
    throw Error("Dossier introuvable.");
  if (
    !Number.isFinite(quote.vat) ||
    quote.vat < 0 ||
    quote.vat > 100 ||
    quote.lines.some(
      (l) =>
        !l.label.trim() ||
        !Number.isFinite(l.quantity) ||
        l.quantity <= 0 ||
        !Number.isFinite(l.unitPrice) ||
        l.unitPrice < 0,
    )
  )
    throw Error("Vérifiez les libellés, quantités, prix et taux de TVA.");
  const current = db.quotes?.find((q) => q.id === quote.id);
  if (current?.state === "Validé")
    throw Error("Un devis validé ne peut plus être modifié.");
  const result = record(
    {
      ...db,
      quotes: [...(db.quotes || []).filter((q) => q.id !== quote.id), quote],
    },
    quote.vehicle,
    "Devis " + quote.state.toLowerCase() + " enregistré",
  );
  return quote.state === "À valider" && quote.lines.length
    ? prepareClientMessage(result, quote.vehicle, "quote")
    : result;
}
export function approveQuote(db: DB, id: string) {
  const quote = db.quotes?.find((q) => q.id === id);
  if (!quote || quote.state !== "À valider" || !quote.lines.length)
    throw Error("Un devis avec des lignes doit être soumis avant validation.");
  const next = record(
    {
      ...db,
      quotes: db.quotes!.map((q) =>
        q.id === id ? { ...q, state: "Validé" as const } : q,
      ),
    },
    quote.vehicle,
    "Accord client saisi manuellement pour le devis",
  );
  const vehicle = next.vehicles.find((v) => v.id === quote.vehicle)!;
  return vehicle.status === "Devis à valider"
    ? updateVehicle(next, vehicle.id, { status: "Diagnostic" })
    : next;
}

````

## src/scene.ts

````typescript
import { demoShowroom } from "./guided-domain";
import { occludesTarget } from "./camera-occlusion";
import {
  vehicleView,
  zoneView,
  isRendered,
  shortestTurn,
} from "./camera-navigation";
import { portoLayout, type DealershipLayout } from "./dealership-layout";
import * as THREE from "three";
import { team } from "./team-data";
import { isPresent } from "./dashboard-domain";
import { loadVehicleAsset, disposeObject, supportedAsset } from "./assets";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { bayPosition, vehiclePosition, zones, type Vehicle } from "./domain";
import {
  walls,
  doors,
  blocked,
  findPath,
  nearestWalkable,
  type Box,
} from "./navigation";
export type Selection = {
  kind:
    | "zone"
    | "customer"
    | "inventory"
    | "vehicle"
    | "wheel"
    | "bay"
    | "technician"
    | "stock"
    | "reception"
    | "delivery"
    | "office"
    | "door"
    | "part";
  id: string;
};
export type Mode = "overview" | "walk" | "free";
const palette = {
  floor: "#c6ccc9",
  wall: "#f0f1ea",
  navy: "#233c4c",
  blue: "#567e96",
  wood: "#ac9878",
};
export class GarageScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  controls: OrbitControls;
  mode: Mode = "overview";
  speed = 3.8;
  reduced = false;
  quality = "standard";
  private frame = 0;
  private occlusionBounds = new Map<THREE.Object3D, THREE.Box3>();
  private cameraFlight: {
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null = null;
  private last = 0;
  private keys = new Set<string>();
  private yaw = 0;
  private pitch = 0;
  private path: [number, number][] = [];
  private furniture: Box[] = [];
  private cars = new THREE.Group();
  private generation = 0;
  private assetDisabled: string[] = [];
  private inspectedId: string | null = null;
  private wheelObjects = new Map<string, THREE.Group[]>();
  private liftGroups = new Map<number, THREE.Group>();
  private doorMeshes = new Map<string, THREE.Mesh>();
  private closed = new Set<string>();
  private ray = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private highlight = new THREE.Group();
  private cohortHighlight = new THREE.Group();
  private cohortIDs: string[] = [];
  private selected: string | null = null;
  private focusedVehicle: string | null = null;
  private focusRear = false;
  private currentCars: Vehicle[] = [];
  private down = [0, 0];
  private disposed = false;
  private ro: ResizeObserver;
  private cleanups: (() => void)[] = [];
  private lastPosition = 0;
  private hovered = "";
  constructor(
    private host: HTMLDivElement,
    private select: (s: Selection) => void,
    private position: (x: number, z: number) => void,
    private hint: (s: string) => void,
    private failure: (s: string) => void,
    private layout: DealershipLayout = portoLayout,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    host.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color("#dde5e4");
    this.scene.fog = new THREE.Fog("#dde5e4", 180, 360);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enabled = true;
    this.controls.enablePan = true;
    this.controls.enableRotate = false;
    this.controls.screenSpacePanning = false;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    this.controls.touches.ONE = THREE.TOUCH.PAN;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    this.controls.minDistance = 7;
    this.controls.addEventListener("change", () => {
      const target = this.controls.target;
      const dx = THREE.MathUtils.clamp(target.x, -24, 24) - target.x;
      const dz = THREE.MathUtils.clamp(target.z, -70, 20) - target.z;
      target.x += dx;
      target.z += dz;
      this.camera.position.x += dx;
      this.camera.position.z += dz;
    });
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.65;
    this.controls.addEventListener("start", () => {
      this.cameraFlight = null;
    });
    this.controls.maxPolarAngle = Math.PI / 2 - 0.06;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 85;
    this.scene.add(new THREE.HemisphereLight("#fffdf3", "#5b6b73", 2.7));
    const sun = new THREE.DirectionalLight("#fff8e9", 3.7);
    sun.position.set(-25, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.camera.far = 100;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);
    this.scene.add(sun.target);
    this.build();
    for (const object of this.scene.children) {
      if (object.userData.occluder)
        this.occlusionBounds.set(
          object,
          new THREE.Box3().setFromObject(object),
        );
    }
    this.scene.add(this.cars, this.highlight, this.cohortHighlight);
    this.setMode("overview");
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.listen(window, "keydown", (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches("input,textarea,select")) return;
      this.keys.add(e.code);
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "KeyZ",
          "KeyQ",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
        ].includes(e.code)
      )
        e.preventDefault();
      if (e.code === "KeyE" && this.mode === "walk") {
        this.interact();
      }
      if (e.code === "Escape") this.path = [];
    });
    this.listen(window, "keyup", (e: KeyboardEvent) =>
      this.keys.delete(e.code),
    );
    this.listen(window, "blur", () => this.keys.clear());
    this.listen(document, "pointerlockchange", () => {
      if (document.pointerLockElement !== this.renderer.domElement)
        this.keys.clear();
    });
    this.listen(this.renderer.domElement, "pointerdown", (e: PointerEvent) => {
      this.down = [e.clientX, e.clientY];
    });
    this.listen(this.renderer.domElement, "pointerup", (e: PointerEvent) => {
      if (Math.hypot(e.clientX - this.down[0], e.clientY - this.down[1]) > 5)
        return;
      if (this.mode === "walk") {
        if (document.pointerLockElement === this.renderer.domElement)
          this.interact();
        else
          this.renderer.domElement
            .requestPointerLock()
            ?.catch(() =>
              this.hint(
                "Maintenez le bouton de la souris pour regarder autour de vous.",
              ),
            );
      } else {
        this.pick(e.clientX, e.clientY, true);
      }
    });
    this.listen(this.renderer.domElement, "pointermove", (e: PointerEvent) => {
      if (
        this.mode === "walk" &&
        (document.pointerLockElement === this.renderer.domElement ||
          e.buttons === 1)
      ) {
        this.yaw -= e.movementX * 0.0024;
        this.pitch = THREE.MathUtils.clamp(
          this.pitch - e.movementY * 0.0024,
          -1.3,
          1.3,
        );
      } else if (this.mode !== "walk") this.pick(e.clientX, e.clientY, false);
    });
    this.listen(this.renderer.domElement, "webglcontextlost", (e: Event) => {
      e.preventDefault();
      this.failure(
        "La 3D est indisponible. Les dossiers restent accessibles en vue liste.",
      );
    });
    this.frame = requestAnimationFrame((t) => this.tick(t));
  }
  private listen(target: EventTarget, event: string, handler: any) {
    target.addEventListener(event, handler);
    this.cleanups.push(() => target.removeEventListener(event, handler));
  }
  private material(color: string, metalness = 0, roughness = 0.7) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness });
  }
  private box(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    tag?: Selection,
  ) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      this.material(color),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    if (tag) m.userData.select = tag;
    parent.add(m);
    return m;
  }
  private cylinder(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    color: string,
  ) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 24),
      this.material(color, 0.35, 0.5),
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  private label(
    text: string,
    x: number,
    y: number,
    z: number,
    width = 3,
    color = "#233c4c",
    bg = "#ffffff",
    parent: THREE.Object3D = this.scene,
  ) {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = color;
    ctx.font = "600 43px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 384, 64);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, depthTest: true }),
    );
    s.position.set(x, y, z);
    s.scale.set(width, width / 6, 1);
    s.userData.sceneLabel = true;
    parent.add(s);
    return s;
  }
  private solid(
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    color: string,
    tag?: Selection,
  ) {
    this.furniture.push({ x, z, w, d });
    const object = this.box(this.scene, x, h / 2, z, w, h, d, color, tag);
    object.userData.occluder = true;
    return object;
  }
  private get depth() {
    return 17 + 7 * (this.layout.workshopSpacing || 5);
  }
  private activeWalls() {
    return walls
      .filter(
        (w) =>
          this.layout.waitingRoom || !(w.x < -12 && (w.z === -8 || w.z === 2)),
      )
      .map((w) =>
        w.z === -52
          ? { ...w, z: -this.depth }
          : Math.abs(w.x) === 22 && w.d === 70
            ? { ...w, z: (18 - this.depth) / 2, d: 18 + this.depth }
            : w,
      );
  }
  private build() {
    this.box(this.scene, 0, -0.25, 5, 110, 0.4, 110, "#aab8b2");
    this.box(
      this.scene,
      0,
      -0.015,
      (18 - this.depth) / 2,
      44,
      0.12,
      18 + this.depth,
      palette.floor,
    );
    this.box(this.scene, 0, -0.01, 24, 44, 0.1, 12, "#717b7e");
    zones
      .filter((z) => this.layout.waitingRoom || z.id !== "attente")
      .forEach((zone) => {
        if (zone.id !== "atelier" && zone.id !== "parking")
          this.box(
            this.scene,
            zone.x,
            0.052,
            zone.z,
            zone.x === 0 ? 23 : 9.6,
            0.02,
            zone.id === "attente"
              ? 9.5
              : zone.id === "bureau"
                ? 9.5
                : zone.id === "accueil"
                  ? 15.6
                  : zone.id === "showroom"
                    ? 8.5
                    : 11.5,
            zone.id === "stock"
              ? "#aab9b6"
              : zone.id === "carrosserie"
                ? "#bcc6c5"
                : "#d9dcd6",
            { kind: "zone", id: zone.id },
          );
        const sign = this.label(
          zone.short.toUpperCase(),
          zone.x,
          3.3,
          zone.z,
          zone.id === "atelier" ? 5 : 3.2,
        );
        sign.userData.select = { kind: "zone", id: zone.id };
      });
    this.box(this.scene, 0, 0.057, -30, 23, 0.015, 40, palette.floor, {
      kind: "zone",
      id: "atelier",
    });
    this.box(this.scene, -7, 0.059, -30, 5, 0.012, 40, "#b6c1bb", {
      kind: "zone",
      id: "parking",
    });
    this.activeWalls().forEach((b) => {
      const wall = this.box(
        this.scene,
        b.x,
        1.45,
        b.z,
        b.w,
        2.9,
        b.d,
        palette.wall,
      );
      wall.userData.occluder = true;
      if (b.z === 18) {
        wall.material = new THREE.MeshPhysicalMaterial({
          color: "#adcdd3",
          transparent: true,
          opacity: 0.16,
          roughness: 0.15,
          depthWrite: false,
        });
      }
      this.box(
        this.scene,
        b.x,
        0.12,
        b.z,
        b.w + 0.04,
        0.24,
        b.d + 0.04,
        palette.navy,
      );
    });
    // Doorways stay visible; doors start open and may be closed by interaction.
    doors.forEach((d) => {
      const m = this.box(
        this.scene,
        d.x,
        1.2,
        d.z - 1.5,
        0.15,
        2.4,
        2.9,
        "#7e999e",
        { kind: "door", id: d.id },
      );
      m.rotation.y = Math.PI / 2;
      this.doorMeshes.set(d.id, m);
      this.label("PORTE", d.x, 2.85, d.z, 1.2);
    });
    for (let i = 1; i <= 8; i++) {
      const [x, z] = bayPosition(i, this.layout);
      this.box(this.scene, x, 0.061, z, 5, 0.025, 4.6, "#abb6b3");
      for (const edge of [-2.45, 2.45])
        this.box(this.scene, x + edge, 0.08, z, 0.06, 0.02, 4.6, "#e6e8dc");
      const tag: Selection = { kind: "bay", id: String(i) };
      for (const dx of [-1.65, 1.65]) {
        this.solid(x + dx, z, 0.32, 0.6, 3.1, "#bd3d42", tag);
        this.box(
          this.scene,
          x + dx,
          3.12,
          z,
          0.48,
          0.16,
          0.78,
          palette.blue,
          tag,
        );
      }
      const lift = new THREE.Group();
      lift.position.set(x, 0, z);
      for (const dx of [-0.65, 0.65])
        this.box(lift, dx, 0.14, 0, 0.2, 0.16, 3.6, palette.navy, tag);
      this.scene.add(lift);
      this.liftGroups.set(i, lift);
      this.label(`POSTE ${String(i).padStart(2, "0")}`, x, 3.8, z, 2.3);
      this.solid(x + (x < 0 ? -3 : 3), z + 1.5, 0.75, 0.5, 0.9, "#687d83", {
        kind: "stock",
        id: "tools",
      });
    }
    // Reception counter, screens and waiting lounge.
    this.solid(-18, 7.5, 5, 1.2, 1.05, palette.wood, {
      kind: "reception",
      id: "reception",
    });
    this.box(this.scene, -18, 1.08, 7.5, 5.2, 0.08, 1.4, "#eceee7");
    for (const x of [-19.2, -16.8]) {
      this.box(this.scene, x, 1.5, 7.5, 0.85, 0.6, 0.07, palette.navy, {
        kind: "reception",
        id: "reception",
      });
      this.box(this.scene, x, 1.2, 7.6, 0.2, 0.3, 0.2, "#657880");
    }
    for (const z of this.layout.waitingRoom ? [-5.5, -0.5] : []) {
      this.solid(-20, z, 1.2, 3, 0.65, "#74877e");
      this.box(this.scene, -20.5, 1, z, 0.22, 0.75, 3, "#74877e");
    }
    if (this.layout.waitingRoom)
      this.solid(-16, -5, 2, 1.3, 0.42, palette.wood);
    this.solid(-20, -14, 2.2, 1.1, 0.78, palette.wood, {
      kind: "office",
      id: "office",
    });
    this.box(this.scene, -20, 1.12, -14, 0.9, 0.62, 0.1, palette.navy, {
      kind: "office",
      id: "office",
    });
    const reception = this.person("Éric", -18, 6, "customer");
    reception.userData.select = { kind: "zone", id: "accueil" };
    this.scene.add(reception);
    this.label("ACCUEIL · RÉCEPTION CLIENTS", -18, 2.4, 7.5, 4);
    this.box(this.scene, -18, 0.5, 8.14, 4.7, 0.7, 0.08, "#315e7b", {
      kind: "reception",
      id: "reception",
    });
    // Stock shelves with separately selectable reference boxes.
    for (const x of [14, 20])
      for (const z of [-15, -10]) {
        this.solid(x, z, 1.1, 3, 2.25, "#526b71", {
          kind: "stock",
          id: "shelf",
        });
        for (let row = 0; row < 3; row++) {
          this.box(
            this.scene,
            x,
            0.45 + row * 0.6,
            z,
            1.2,
            0.08,
            3.1,
            "#c4c9c1",
          );
          for (let j = 0; j < 3; j++)
            this.box(
              this.scene,
              x,
              0.7 + row * 0.6,
              z - 1 + j,
              0.85,
              0.42,
              0.7,
              j % 2 ? "#b29e7e" : "#d4c6a9",
              {
                kind: "stock",
                id: row === 0 ? "disc" : row === 1 ? "pads" : "filter",
              },
            );
        }
      }
    this.solid(20, 0, 2.5, 6, 2.6, "#d4ded9", { kind: "delivery", id: "body" });
    this.box(this.scene, 18.7, 1.25, 0, 0.04, 2.2, 5, "#9daba7");
    this.label("CABINE PEINTURE", 20, 2.8, 0, 3);
    this.solid(21, 17, 1.3, 2, 0.9, palette.wood, {
      kind: "delivery",
      id: "delivery",
    });
    // Porto reference: a glazed frontage, two distinct showrooms and a rear workshop.
    this.label(
      this.layout.leftBrand.toUpperCase(),
      -7,
      3.8,
      15,
      5,
      "#eef2ef",
      "#303a40",
    );
    this.label(
      this.layout.rightBrand.toUpperCase(),
      7,
      3.8,
      15,
      5,
      "#eef2ef",
      "#22493e",
    );
    for (const x of [-19, -14, -9, -4, 4, 9, 14, 19]) {
      const pane = this.box(this.scene, x, 1.6, 18, 4.5, 3.2, 0.08, "#c4dddd");
      pane.material = new THREE.MeshPhysicalMaterial({
        color: "#b9d6db",
        transparent: true,
        opacity: 0.18,
        roughness: 0.12,
        metalness: 0.1,
        depthWrite: false,
      });
      this.box(this.scene, x + 2.35, 1.7, 18, 0.18, 3.4, 0.3, "#5f676b");
    }
    for (let i = 0; i < 8; i++) {
      const z = -12 - i * (this.layout.workshopSpacing || 5);
      this.box(this.scene, -7, 0.064, z, 4.5, 0.02, 4.6, "#899795");
      this.box(this.scene, -9.3, 0.085, z, 0.06, 0.02, 4.6, "#e8ece6");
      this.label(`PARC ${i + 1}`, -7, 0.4, z + 2, 1.5);
    }
    const roof = new THREE.Group();
    roof.userData.overhead = true;
    this.scene.add(roof);
    // Architectural beams, high windows and practical strip lights.
    for (const z of [-48, -40, -32, -24, -16, -8, 0, 8, 16]) {
      this.box(roof, 0, 5.5, z, 44, 0.15, 0.18, "#8e9e9d");
      for (const x of [-10, 10]) {
        this.box(roof, x, 5.4, z, 6, 0.06, 0.2, "#fffbe9");
      }
    }
    for (const x of [-21.8, 21.8])
      for (const z of [-13, -3, 9]) {
        this.box(this.scene, x, 2, z, 0.04, 1.15, 3, "#b5d2d2");
      }
    for (const x of [-18, -9, 0, 9, 18]) {
      this.box(this.scene, x, 0.06, 24, 0.08, 0.02, 9, "#d7dacc");
    }
    for (const x of [-24, 24]) {
      this.cylinder(this.scene, x, 0.65, 18, 0.8, 1.3, "#708075");
      this.cylinder(this.scene, x, 2, 18, 1.1, 1.6, "#66816b");
    }
  }
  private car(v: Vehicle, x: number, z: number, display = false) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.userData.select = { kind: "vehicle", id: v.id };
    const suv = v.shape === "suv";
    const length = v.shape === "hatch" ? 3.65 : 4.25;
    const body = this.material(v.color, 0.55, 0.28);
    const glass = this.material("#263c47", 0.35, 0.18);
    const rounded = (
      w: number,
      h: number,
      d: number,
      y: number,
      mat: THREE.Material,
    ) => {
      const shape = new THREE.Shape();
      const r = 0.14;
      shape.moveTo(-w / 2 + r, -d / 2);
      shape.lineTo(w / 2 - r, -d / 2);
      shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
      shape.lineTo(w / 2, d / 2 - r);
      shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
      shape.lineTo(-w / 2 + r, d / 2);
      shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
      shape.lineTo(-w / 2, -d / 2 + r);
      shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
      const mesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: h,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.07,
          bevelThickness: 0.07,
        }),
        mat,
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = y;
      mesh.castShadow = true;
      g.add(mesh);
      return mesh;
    };
    rounded(1.85, 0.48, length, 0.45, body);
    rounded(1.72, 0.18, length - 0.2, 0.93, body);
    // Tapered cabin via explicit side profile extruded across the car's width.
    const profile = new THREE.Shape();
    profile.moveTo(-1.17, 1.07);
    profile.lineTo(-0.72, suv ? 1.86 : 1.61);
    profile.lineTo(suv ? 0.85 : 0.48, suv ? 1.86 : 1.61);
    profile.lineTo(1.25, 1.07);
    profile.closePath();
    const cabin = new THREE.Mesh(
      new THREE.ExtrudeGeometry(profile, { depth: 1.6, bevelEnabled: false }),
      glass,
    );
    cabin.rotation.y = Math.PI / 2;
    cabin.position.x = -0.8;
    cabin.castShadow = true;
    g.add(cabin);
    rounded(1.59, 0.055, suv ? 1.65 : 1.2, suv ? 1.87 : 1.62, body);
    for (const side of [-1, 1]) {
      this.box(g, side * 0.88, 1.17, 0.05, 0.035, 0.12, 2.15, v.color);
      this.box(g, side * 0.81, 1.37, -0.05, 0.035, 0.55, 0.08, v.color);
      this.box(g, side * 1.02, 1.25, -0.78, 0.22, 0.15, 0.3, v.color);
      for (const zz of [-0.6, 0.65])
        this.box(g, side * 0.94, 1.03, zz, 0.03, 0.04, 0.19, "#d4dbdc");
    }
    this.box(g, 0, 0.55, -length / 2 - 0.025, 1.2, 0.18, 0.04, "#25333a");
    this.box(g, 0, 0.82, -length / 2 - 0.07, 0.66, 0.14, 0.03, "#eff1e8");
    for (const side of [-1, 1]) {
      this.box(
        g,
        side * 0.65,
        0.93,
        -length / 2 - 0.055,
        0.45,
        0.11,
        0.04,
        "#fcf5d5",
      );
      this.box(
        g,
        side * 0.68,
        0.88,
        length / 2 + 0.055,
        0.4,
        0.11,
        0.04,
        "#b9574e",
      );
    }
    const wheels: THREE.Group[] = [];
    for (const side of [-1, 1])
      for (const zz of [-length * 0.3, length * 0.3]) {
        const wheel = new THREE.Group();
        wheel.position.set(side * 0.94, 0.46, zz);
        wheel.userData.select = display
          ? { kind: "office", id: "showroom" }
          : { kind: "wheel", id: v.id };
        const tire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.43, 0.43, 0.27, 32),
          this.material("#252c2e", 0, 0.95),
        );
        tire.rotation.z = Math.PI / 2;
        wheel.add(tire);
        const rim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.285, 24),
          this.material("#bec6c7", 0.9, 0.25),
        );
        rim.rotation.z = Math.PI / 2;
        wheel.add(rim);
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16),
          this.material("#5d717b", 0.8, 0.2),
        );
        hub.rotation.z = Math.PI / 2;
        wheel.add(hub);
        for (let n = 0; n < 5; n++) {
          const spoke = this.box(
            wheel,
            side * 0.155,
            0,
            0,
            0.025,
            0.065,
            0.52,
            "#83959b",
          );
          spoke.rotation.x = (n * Math.PI) / 5;
        }
        g.add(wheel);
        wheels.push(wheel);
      }
    if (!display) this.wheelObjects.set(v.id, wheels);
    return g;
  }
  update(
    vehicles: Vehicle[],
    disabled: string[] = [],
    live: Record<
      string,
      { blocked?: boolean; runningSince?: string | null }
    > = {},
    demo = false,
  ) {
    const generation = ++this.generation;
    this.assetDisabled = disabled;
    this.currentCars = vehicles;
    this.clear(this.cars);
    this.wheelObjects.clear();
    vehicles.filter(isPresent).forEach((v) => {
      const [x, z] = vehiclePosition(v, vehicles, this.layout);
      const g = this.car(v, x, z);
      if (v.bay) g.position.y = this.liftGroups.get(v.bay)?.position.y || 0;
      this.cars.add(g);
      const assetId =
        v.assetId ||
        "kenney-" +
          (v.shape === "suv"
            ? "suv"
            : v.shape === "hatch"
              ? "hatchback-sports"
              : "sedan");
      if (supportedAsset(assetId) && !this.assetDisabled.includes(assetId)) {
        const fallback = [...g.children];
        g.userData.fallback = fallback;
        loadVehicleAsset(assetId)
          .then((asset) => {
            if (this.disposed || generation !== this.generation) {
              disposeObject(asset);
              return;
            }
            asset.traverse((o) => {
              if (
                o instanceof THREE.Mesh &&
                o.name.toLowerCase().includes("wheel")
              )
                o.userData.select = { kind: "wheel", id: v.id };
            });
            g.add(asset);
            g.userData.asset = asset;
            fallback.forEach((o) => (o.visible = this.inspectedId === v.id));
            asset.visible = this.inspectedId !== v.id;
          })
          .catch(() =>
            this.hint(
              "Modèle GLB indisponible : représentation procédurale de secours.",
            ),
          );
      }
      if (v.bay) {
        const person = this.person(
          v.technician,
          x + (x < 0 ? 2.4 : -2.4),
          z + 1.3,
        );
        this.cars.add(person);
      }
    });
    const represented = new Set(
      vehicles.filter((v) => isPresent(v) && v.bay).map((v) => v.technician),
    );
    team
      .filter((t) => !represented.has(t.name))
      .forEach((t, i) => {
        const position =
          t.department === "Carrosserie"
            ? [15, 2]
            : t.department === "Pneumatiques"
              ? [1, 6]
              : t.department === "Vitrage"
                ? [-16, 6]
                : [-17, -12 + i];
        this.cars.add(this.person(t.name, position[0], position[1]));
      });
    vehicles.filter(isPresent).forEach((v) => {
      const [x, z] = vehiclePosition(v, vehicles, this.layout);
      const vehicleLabel = this.label(
        v.plate + " · " + (live[v.id]?.blocked ? "Bloqué" : v.status),
        x,
        2.65,
        z,
        3,
        live[v.id]?.blocked || v.status === "En intervention"
          ? "#a42d3b"
          : v.status === "Prêt à livrer"
            ? "#127348"
            : v.status === "Devis à valider"
              ? "#935500"
              : "#385965",
        live[v.id]?.blocked || v.status === "En intervention"
          ? "#ffe3e7"
          : v.status === "Prêt à livrer"
            ? "#dff8e8"
            : v.status === "Devis à valider"
              ? "#fff0ca"
              : "#f6faf4",
        this.cars,
      );
      vehicleLabel.userData.vehicleLabel = v.id;
      vehicleLabel.userData.select = { kind: "vehicle", id: v.id };
    });
    if (demo) {
      if (this.layout.waitingRoom)
        ["v11", "v12", "v13"].forEach((id, i) => {
          const v = vehicles.find((v) => v.id === id && isPresent(v));
          if (!v) return;
          const person = this.person(
            v.client.split(" ")[0],
            -19 + i * 1.2,
            -3,
            "customer",
          );
          person.userData.select = { kind: "customer", id: v.id };
          const badge = this.cars.children.find(
            (o) =>
              o instanceof THREE.Sprite &&
              o.userData.select?.kind === "customer" &&
              o.userData.select?.id === v.client.split(" ")[0],
          );
          if (badge) badge.userData.select = { kind: "customer", id: v.id };
          this.cars.add(person);
        });
      demoShowroom.forEach((v, i) => {
        const proxy = {
          ...vehicles[0],
          ...v,
          shape: "suv",
          plate: "SHOWROOM",
          status: "Réception",
        } as Vehicle;
        const group = this.car(proxy, i === 2 ? -7 : 4 + i * 5, 14, true);
        group.userData.select = { kind: "inventory", id: v.id };
        group.traverse((o) => {
          if (o.userData.select)
            o.userData.select = { kind: "inventory", id: v.id };
        });
        this.cars.add(group);
      });
    }
    this.setSelected(this.selected);
    this.setFocusIds(this.cohortIDs);
  }
  private person(
    name: string,
    x: number,
    z: number,
    kind: "technician" | "customer" = "technician",
  ) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.userData.select = { kind, id: name };
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.57, 18),
      this.material("#38596d"),
    );
    torso.position.set(0, 1.05, 0);
    torso.castShadow = true;
    g.add(torso);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 18, 14),
      this.material("#c7a488"),
    );
    head.position.set(0, 1.52, 0);
    head.castShadow = true;
    g.add(head);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.085, 0.53, 6, 12),
        this.material("#2b3b46"),
      );
      leg.position.set(side * 0.12, 0.44, 0);
      g.add(leg);
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.065, 0.39, 6, 12),
        this.material("#38596d"),
      );
      arm.position.set(side * 0.29, 1.02, 0.02);
      arm.rotation.z = side * 0.13;
      g.add(arm);
      this.box(g, side * 0.12, 0.08, -0.06, 0.2, 0.14, 0.31, "#27323a");
    }
    const uniform = team.find((t) => t.name === name)?.color || "#355b78";
    g.children.forEach((o) => {
      if (
        o instanceof THREE.Mesh &&
        o.geometry instanceof THREE.CapsuleGeometry &&
        o.position.y > 0.8
      )
        (o.material as THREE.MeshStandardMaterial).color.set(uniform);
    });
    const torsoMesh = g.children[0] as THREE.Mesh;
    torsoMesh.scale.set(1.12, 1.2, 0.82);
    (torsoMesh.material as THREE.MeshStandardMaterial).color.set(uniform);
    this.cylinder(g, 0, 1.39, 0, 0.08, 0.12, "#c7a488");
    this.box(g, 0, 1.51, -0.14, 0.06, 0.07, 0.055, "#bc967e");
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 10, 8),
        this.material("#313b40"),
      );
      eye.position.set(side * 0.059, 1.56, -0.142);
      g.add(eye);
      this.box(g, side * 0.105, 1.1, -0.19, 0.12, 0.12, 0.026, uniform);
    }
    this.box(g, 0, 0.83, 0, 0.45, 0.04, 0.35, "#26333c");
    // A fitted cap, ears, hands and contrasting workwear details.
    this.cylinder(
      g,
      0,
      1.68,
      0,
      0.17,
      0.08,
      kind === "technician" ? uniform : "#755f51",
    );
    this.box(g, 0, 1.66, -0.15, 0.26, 0.04, 0.19, uniform);
    for (const side of [-1, 1]) {
      this.box(g, side * 0.15, 1.52, 0, 0.035, 0.09, 0.06, "#c7a488");
      this.box(
        g,
        side * 0.31,
        0.76,
        0.03,
        0.09,
        0.11,
        0.09,
        kind === "technician" ? "#d1ac61" : "#c7a488",
      );
    }
    this.box(g, 0, 1.05, -0.21, 0.015, 0.48, 0.012, "#ccd4d8");
    if (kind === "technician") {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 160;
      const context = canvas.getContext("2d")!;
      context.fillStyle = uniform;
      context.fillRect(0, 0, 512, 160);
      context.fillStyle = "#ffffff";
      context.font = "bold 70px Arial";
      context.textAlign = "center";
      context.fillText(name.toUpperCase(), 256, 103);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const back = new THREE.Mesh(
        new THREE.PlaneGeometry(0.49, 0.16),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
      );
      back.position.set(0, 1.23, 0.205);
      g.add(back);
    }
    const badge = this.label(
      name,
      x,
      2.05,
      z,
      1.6,
      "#23465b",
      "#ffffff",
      this.cars,
    );
    badge.userData.select = { kind, id: name };
    return g;
  }
  focusEntity(kind: Selection["kind"], id: string) {
    const object = this.cars.children.find(
      (o) =>
        o instanceof THREE.Group &&
        o.userData.select?.kind === kind &&
        o.userData.select?.id === id,
    );
    if (!object) return;
    const start = this.camera.position.clone(),
      target = this.controls.target.clone();
    this.setMode("free");
    this.camera.position.copy(start);
    this.controls.target.copy(target);
    const view = vehicleView(
      object.position.x,
      object.position.z,
      this.camera.aspect,
    );
    this.cameraFlight =
      kind === "inventory"
        ? {
            position: new THREE.Vector3(...view.position),
            target: new THREE.Vector3(...view.target),
          }
        : {
            position: object.position.clone().add(new THREE.Vector3(3, 3, 5)),
            target: object.position.clone().add(new THREE.Vector3(0, 1, 0)),
          };
    if (this.reduced) {
      this.camera.position.copy(this.cameraFlight.position);
      this.controls.target.copy(this.cameraFlight.target);
      this.cameraFlight = null;
      this.controls.update();
    }
  }
  private boxes() {
    return [
      ...this.activeWalls(),
      ...this.furniture,

      ...this.currentCars.filter(isPresent).map((v) => {
        const [x, z] = vehiclePosition(v, this.currentCars, this.layout);
        return { x, z, w: 2.05, d: 4.5 };
      }),
      ...doors
        .filter((d) => this.closed.has(d.id))
        .map((d) => ({ x: d.x, z: d.z, w: 0.2, d: 3 })),
    ];
  }
  toggleDoor(id: string) {
    const m = this.doorMeshes.get(id);
    if (!m) return;
    if (this.closed.has(id)) {
      this.closed.delete(id);
      m.rotation.y = Math.PI / 2;
      m.position.z = doors.find((d) => d.id === id)!.z - 1.5;
    } else {
      const d = doors.find((d) => d.id === id)!;
      if (
        Math.hypot(this.camera.position.x - d.x, this.camera.position.z - d.z) <
        1.7
      ) {
        this.hint("Éloignez-vous de la porte avant de la fermer.");
        return;
      }
      this.closed.add(id);
      m.rotation.y = 0;
      m.position.z = d.z;
    }
    this.hint(
      this.closed.has(id) ? "Porte fermée · E pour ouvrir" : "Porte ouverte",
    );
  }
  lift(bay: number) {
    const g = this.liftGroups.get(bay);
    if (!g) return;
    const height = g.position.y > 0.1 ? 0 : 1.1;
    g.position.y = height;
    const car = this.cars.children.find(
      (c) =>
        c.userData.select?.kind === "vehicle" &&
        this.currentCars.find((v) => v.id === c.userData.select.id)?.bay ===
          bay,
    );
    if (car) car.position.y = height;
    this.hint(height ? "Pont levé" : "Pont abaissé");
  }
  setSelected(id: string | null) {
    this.selected = id;
    if (!id) this.focusedVehicle = null;
    this.clear(this.highlight);
    if (!id) return;
    const v = this.currentCars.find((v) => v.id === id);
    if (!v) return;
    const [x, z] = vehiclePosition(v, this.currentCars, this.layout);
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(2.35, 2.41, 80),
      new THREE.MeshBasicMaterial({ color: "#326e95", side: THREE.DoubleSide }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.09, z);
    this.highlight.add(mesh);
  }
  setFocusIds(ids: string[]) {
    this.cohortIDs = ids;
    this.clear(this.cohortHighlight);
    for (const id of ids) {
      const v = this.currentCars.find((v) => v.id === id && isPresent(v));
      if (!v) continue;
      const [x, z] = vehiclePosition(v, this.currentCars, this.layout);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.35, 2.44, 64),
        new THREE.MeshBasicMaterial({
          color: "#599678",
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.1, z);
      this.cohortHighlight.add(ring);
    }
  }
  inspect(id: string, exploded: boolean) {
    const car = this.cars.children.find((c) => c.userData.select?.id === id);
    if (!car) return;
    this.inspectedId = exploded ? id : null;
    const asset = car.userData.asset as THREE.Group | undefined;
    if (asset) {
      asset.visible = !exploded;
      (car.userData.fallback as THREE.Object3D[]).forEach(
        (o) => (o.visible = exploded),
      );
    }
    const wheels = this.wheelObjects.get(id);
    if (wheels) {
      wheels[0].position.x = exploded ? -1.85 : -0.94;
      let brake = car.getObjectByName("brake");
      if (!brake) {
        const group = new THREE.Group();
        group.name = "brake";
        group.position.set(-1, 0.46, wheels[0].position.z);
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.055, 48),
          this.material("#9ba5a5", 0.85, 0.3),
        );
        disc.rotation.z = Math.PI / 2;
        disc.userData.select = { kind: "part", id: "disc" };
        group.add(disc);
        this.box(group, -0.08, 0.1, 0, 0.12, 0.29, 0.2, "#a87755", {
          kind: "part",
          id: "caliper",
        });
        this.box(group, -0.15, 0.1, 0, 0.055, 0.18, 0.14, "#39484f", {
          kind: "part",
          id: "pads",
        });
        car.add(group);
        brake = group;
      }
      brake.visible = exploded;
    }
    if (exploded) {
      this.setMode("free");
      this.focusedVehicle = id;
      this.camera.position.set(car.position.x - 5, 2.7, car.position.z - 3.8);
      this.controls.target.set(car.position.x - 1, 0.6, car.position.z - 1.2);
      this.controls.update();
    }
  }
  focusVehicle(id: string, rear = false) {
    const vehicle = this.currentCars.find((v) => v.id === id);
    if (!vehicle || !isPresent(vehicle)) return;
    const [x, z] = vehiclePosition(vehicle, this.currentCars, this.layout);
    const start = this.camera.position.clone();
    const target = this.controls.target.clone();
    this.setMode("free");
    this.camera.position.copy(start);
    this.controls.target.copy(target);
    this.focusedVehicle = id;
    this.focusRear = rear;
    const view = vehicleView(x, z, this.camera.aspect, rear);
    this.controls.maxDistance = Math.max(18, 8 / this.camera.aspect);
    this.cameraFlight = {
      position: new THREE.Vector3(...view.position),
      target: new THREE.Vector3(...view.target),
    };
    if (this.reduced) {
      this.camera.position.copy(this.cameraFlight.position);
      this.controls.target.copy(this.cameraFlight.target);
      this.cameraFlight = null;
      this.controls.update();
    }
  }
  setMode(mode: Mode) {
    this.cameraFlight = null;
    this.focusedVehicle = null;
    this.controls.maxDistance = mode === "overview" ? 120 : 85;
    this.path = [];
    if (document.pointerLockElement) document.exitPointerLock();
    this.mode = mode;
    this.controls.enabled = true;
    this.keys.clear();
    if (mode === "overview") {
      const scale = Math.max(1, 1.3 / Math.max(this.camera.aspect, 0.35));
      this.camera.position.set(37 * scale, 46 * scale, -13 + 57 * scale);
      this.controls.target.set(0, 0, -13);
      this.controls.update();
    } else if (mode === "walk") {
      this.camera.position.set(-17, 1.7, 13);
      this.yaw = -0.65;
      this.pitch = 0;
      this.camera.rotation.order = "YXZ";
    } else {
      this.camera.position.set(22, 15, 28);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }
  go(zoneId: string) {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;
    if (this.mode !== "walk") {
      const start = this.camera.position.clone();
      const target = this.controls.target.clone();
      this.setMode("free");
      this.camera.position.copy(start);
      this.controls.target.copy(target);
      const framing = zoneView(
        zoneId,
        zone.x,
        zone.z,
        this.camera.aspect,
        this.depth,
      );
      this.controls.maxDistance = 150;
      this.cameraFlight = {
        position: new THREE.Vector3(...framing.position),
        target: new THREE.Vector3(...framing.target),
      };
      if (this.reduced) {
        this.camera.position.copy(this.cameraFlight.position);
        this.controls.target.copy(this.cameraFlight.target);
        this.cameraFlight = null;
      }
      this.hint(
        `Vue ${zone.short} · choisissez un véhicule pour ouvrir son dossier`,
      );
      return;
    }
    doors.forEach((d) => {
      if (this.closed.has(d.id)) this.toggleDoor(d.id);
    });
    const boxes = this.boxes();
    const destination = nearestWalkable([zone.x, zone.z], boxes, this.depth);
    const path = destination
      ? findPath(
          [this.camera.position.x, this.camera.position.z],
          destination,
          boxes,
          this.depth,
        )
      : [];
    if (!path.length) {
      this.hint("Aucun passage disponible vers cette zone.");
      return;
    }
    this.path = path.slice(1);
    this.hint(`En route vers ${zone.short} · Échap pour arrêter`);
  }
  private resize() {
    const { clientWidth: w, clientHeight: h } = this.host;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.focusedVehicle && !this.inspectedId)
      this.focusVehicle(this.focusedVehicle, this.focusRear);
  }
  private pick(x: number, y: number, click: boolean) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((x - r.left) / r.width) * 2 - 1,
      (-(y - r.top) / r.height) * 2 + 1,
    );
    this.ray.setFromCamera(this.pointer, this.camera);
    const hit = this.ray
      .intersectObjects(this.scene.children, true)
      .find(
        (h) =>
          isRendered(h.object) &&
          (!(h.object instanceof THREE.Sprite) || !!h.object.userData.select),
      );
    const s = hit ? this.selection(hit.object) : null;
    if (click && s) this.activate(s);
    this.renderer.domElement.style.cursor = s ? "pointer" : "grab";
    const name =
      s?.kind === "vehicle" || s?.kind === "wheel"
        ? this.currentCars.find((v) => v.id === s.id)?.plate
        : s?.kind === "bay"
          ? `Pont ${s.id}`
          : s?.kind === "stock"
            ? "Ouvrir le magasin"
            : s?.kind === "technician"
              ? s.id
              : s?.kind === "door"
                ? "Ouvrir / fermer la porte"
                : "";
    if (name !== this.hovered) {
      this.hovered = name || "";
      this.hint(this.hovered);
    }
  }
  private selection(o: THREE.Object3D): Selection | null {
    let n: THREE.Object3D | null = o;
    while (n) {
      if (n.userData.select) return n.userData.select;
      n = n.parent;
    }
    return null;
  }
  private activate(s: Selection) {
    if (s.kind === "door") {
      this.toggleDoor(s.id);
      return;
    }
    if (document.pointerLockElement) document.exitPointerLock();
    this.select(s);
  }
  private interact() {
    this.ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hit = this.ray
      .intersectObjects(this.scene.children, true)
      .find(
        (h) =>
          isRendered(h.object) &&
          (!(h.object instanceof THREE.Sprite) || !!h.object.userData.select),
      );
    const target = hit && hit.distance < 5 ? this.selection(hit.object) : null;
    if (target) this.activate(target);
    else
      this.hint(
        "Approchez-vous d’un véhicule, d’une porte ou d’un équipement.",
      );
  }
  private tick(t: number) {
    if (this.disposed) return;
    const dt = Math.min((t - this.last) / 1000, 0.045);
    this.last = t;
    if (this.mode === "walk") {
      this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
      let dx = 0,
        dz = 0;
      if (this.path.length) {
        const p = this.path[0];
        const diff = new THREE.Vector2(
          p[0] - this.camera.position.x,
          p[1] - this.camera.position.z,
        );
        if (diff.length() < 0.09) this.path.shift();
        else {
          diff
            .normalize()
            .multiplyScalar(
              Math.min(
                this.speed * dt,
                new THREE.Vector2(
                  p[0] - this.camera.position.x,
                  p[1] - this.camera.position.z,
                ).length(),
              ),
            );
          dx = diff.x;
          dz = diff.y;
          if (!this.reduced) {
            this.yaw = shortestTurn(this.yaw, Math.atan2(-dx, -dz), dt);
          }
        }
      } else {
        let f =
          Number(
            this.keys.has("KeyW") ||
              this.keys.has("KeyZ") ||
              this.keys.has("ArrowUp"),
          ) - Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"));
        let side =
          Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
          Number(
            this.keys.has("KeyA") ||
              this.keys.has("KeyQ") ||
              this.keys.has("ArrowLeft"),
          );
        const len = Math.hypot(f, side) || 1;
        f /= len;
        side /= len;
        dx =
          (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * side) *
          this.speed *
          dt;
        dz =
          (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * side) *
          this.speed *
          dt;
      }
      const boxes = this.boxes();
      if (
        !blocked(
          this.camera.position.x + dx,
          this.camera.position.z,
          boxes,
          0.38,
          this.depth,
        )
      )
        this.camera.position.x += dx;
      if (
        !blocked(
          this.camera.position.x,
          this.camera.position.z + dz,
          boxes,
          0.38,
          this.depth,
        )
      )
        this.camera.position.z += dz;
      this.camera.position.y = 1.7;
    } else {
      if (this.cameraFlight) {
        const alpha = 1 - Math.exp(-6 * dt);
        this.camera.position.lerp(this.cameraFlight.position, alpha);
        this.controls.target.lerp(this.cameraFlight.target, alpha);
        if (
          this.camera.position.distanceTo(this.cameraFlight.position) < 0.025
        ) {
          this.camera.position.copy(this.cameraFlight.position);
          this.controls.target.copy(this.cameraFlight.target);
          this.cameraFlight = null;
        }
      }
      this.controls.update();
    }
    if (t - this.lastPosition > 180) {
      this.position(this.camera.position.x, this.camera.position.z);
      this.lastPosition = t;
    }
    for (const vehicle of this.cars.children) {
      const asset = vehicle.userData.asset as THREE.Group | undefined;
      const fallback = vehicle.userData.fallback as
        THREE.Object3D[] | undefined;
      if (!asset || !fallback) continue;
      const inspection = this.inspectedId === vehicle.userData.select?.id;
      const detailed =
        !inspection && this.camera.position.distanceTo(vehicle.position) < 24;
      asset.visible = detailed;
      fallback.forEach((object) => {
        object.visible = !detailed;
      });
    }
    const focused = this.mode === "free" && !!this.focusedVehicle;
    const aim = this.controls.target;
    for (const object of this.scene.children) {
      if (object.userData.overhead) object.visible = this.mode !== "free";
      if (object.userData.sceneLabel) object.visible = this.mode === "overview";
      if (object.userData.occluder) {
        object.visible = true;
        if (this.mode !== "walk") {
          const bounds =
            this.occlusionBounds.get(object) ||
            new THREE.Box3().setFromObject(object);
          object.visible = !occludesTarget(bounds, this.camera.position, aim);
        }
      }
    }
    for (const object of this.cars.children) {
      if (object instanceof THREE.Sprite) {
        object.visible =
          !focused || object.userData.vehicleLabel === this.focusedVehicle;
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame((n) => this.tick(n));
  }
  setQuality(low: boolean) {
    this.renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = !low;
    this.resize();
  }
  private clear(g: THREE.Object3D) {
    g.children.forEach((c) =>
      c.traverse((o) => {
        if (o instanceof THREE.Sprite) {
          o.material.map?.dispose();
          o.material.dispose();
        }
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => {
            (m as THREE.MeshBasicMaterial).map?.dispose();
            m.dispose();
          });
        }
      }),
    );
    g.clear();
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.ro.disconnect();
    this.cleanups.forEach((fn) => fn());
    if (document.pointerLockElement === this.renderer.domElement)
      document.exitPointerLock();
    this.controls.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => {
          if ("map" in m) (m.map as THREE.Texture | null)?.dispose();
          m.dispose();
        });
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

````

## src/style.css

````css
:root {
  font-family:
    "DM Sans",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  color: #263d4b;
  background: #f3f5f4;
  font-synthesis: none;
  font-size: 14px;
  --navy: #1a303f;
  --blue: #356e91;
  --muted: #839198;
  --border: #e1e7e4;
  --green: #448674;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
button,
input,
textarea,
select {
  font: inherit;
}
button,
a,
input,
select,
textarea {
  -webkit-tap-highlight-color: transparent;
}
button {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: inherit;
  transition:
    background 0.15s,
    color 0.15s;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
g:focus-visible {
  outline: 3px solid #75a7be;
  outline-offset: 3px;
}
button:hover {
  background: #eaf0ed;
}
a {
  color: inherit;
  text-decoration: none;
}
h1,
h2,
h3,
h4,
p {
  margin: 0;
}
input,
select,
textarea {
  background: #fff;
  border: 1px solid #dce4df;
  color: #2a4352;
  border-radius: 7px;
  padding: 10px 12px;
  width: 100%;
  outline: none;
}
textarea {
  resize: vertical;
  min-height: 90px;
  line-height: 1.6;
}
select {
  cursor: pointer;
}
label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin: 18px 0 7px;
  color: #607580;
}
small {
  font-size: 11px;
  color: #87949b;
}
strong {
  font-weight: 600;
}
h1 {
  font-size: 27px;
  letter-spacing: -1.05px;
  font-weight: 550;
  line-height: 1.25;
}
h2 {
  font-size: 21px;
  letter-spacing: -0.6px;
  font-weight: 550;
}
h3 {
  font-size: 16px;
  font-weight: 600;
}
h4 {
  font-size: 12px;
  color: #506b7b;
  margin: 17px 0 7px;
}
p {
  color: #7c8b92;
  line-height: 1.65;
}
.app-shell {
  display: flex;
  min-height: 100dvh;
}
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 226px;
  background: var(--navy);
  color: #c2cfd5;
  display: flex;
  flex-direction: column;
  padding: 27px 16px 0;
  z-index: 10;
}
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 8px 30px;
  color: #fff;
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -1px;
}
.brand-symbol {
  background: #365464;
  border-radius: 9px;
  width: 37px;
  height: 37px;
  display: grid;
  place-items: center;
}
.brand-3d {
  font-size: 12px;
  vertical-align: top;
  letter-spacing: 0;
  color: #96b9c8;
  margin-left: 4px;
}
.garage-name {
  padding: 15px 3px 22px;
  display: flex;
  align-items: center;
  gap: 9px;
  border-top: 1px solid #314655;
}
.garage-monogram {
  width: 31px;
  height: 32px;
  display: grid;
  place-items: center;
  background: #334b59;
  border-radius: 6px;
  font-size: 10px;
}
.garage-name strong {
  font-size: 12px;
  color: #e1e8ea;
}
.garage-name small {
  display: block;
  font-size: 10px;
  margin-top: 4px;
  color: #8c9eaa;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #86ae97;
  display: inline-block;
  flex-shrink: 0;
}
.garage-name .dot {
  margin-left: auto;
}
.nav-caption {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: #8298a4;
  margin: 11px 12px 15px;
}
.nav-item {
  width: 100%;
  justify-content: flex-start;
  padding: 12px 13px;
  gap: 11px;
  font-size: 12px;
  border-radius: 7px;
  margin-bottom: 5px;
  color: #b2c1c9;
}
.nav-item:hover {
  background: #294352;
  color: #fff;
}
.nav-item.active {
  background: #345467;
  color: #fff;
}
.nav-item.active:before {
  content: "";
  width: 3px;
  height: 18px;
  background: #a8c8d6;
  position: absolute;
  left: 0;
  border-radius: 0 2px 2px 0;
}
.nav-count {
  margin-left: auto;
  font-size: 10px;
  background: #4c6d7d;
  padding: 2px 5px;
  border-radius: 3px;
}
.new-dot {
  height: 5px;
  width: 5px;
  border-radius: 100%;
  background: #91b8a7;
  margin-left: auto;
}
.sidebar-bottom {
  margin-top: auto;
}
.local-card {
  background: #243e4b;
  border: 1px solid #34505d;
  border-radius: 8px;
  margin: 22px 3px;
  padding: 17px 13px;
}
.local-card > svg {
  color: #97b8b1;
  margin-bottom: 12px;
}
.local-card strong {
  display: block;
  font-size: 11px;
  color: #d8e5e6;
}
.local-card p {
  font-size: 11px;
  color: #a0b2ba;
  margin: 8px 0 15px;
}
.local-card > span {
  color: #9ab6b2;
  font-size: 9px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.local-card i {
  width: 4px;
  height: 4px;
  background: #90bda8;
  border-radius: 50%;
}
.user {
  border-top: 1px solid #354c58;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 19px 2px;
}
.user > span,
.avatar {
  background: #dce6e3;
  width: 33px;
  height: 33px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #375364;
  font-size: 11px;
}
.user strong {
  font-size: 11px;
  color: #dde6e8;
}
.user small {
  display: block;
  font-size: 9px;
  margin-top: 4px;
  color: #91a4ae;
}
.user button {
  margin-left: auto;
  color: #8ba1ad;
  padding: 4px;
}
.workspace {
  margin-left: 226px;
  width: calc(100% - 226px);
}
.topbar {
  height: 71px;
  background: #fbfcfb;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
}
.breadcrumbs {
  font-size: 11px;
  color: #84949c;
  display: flex;
  gap: 13px;
  align-items: center;
}
.breadcrumbs span {
  color: #bac5c9;
}
.breadcrumbs strong {
  color: #4f6875;
  font-weight: 500;
}
.top-actions {
  display: flex;
  gap: 18px;
  align-items: center;
}
.demo {
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #7b8c93;
  background: #edf1ed;
  padding: 6px 9px;
  border: 1px solid #e0e7df;
  border-radius: 5px;
}
.demo i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #7ea28b;
}
.icon-button {
  width: 30px;
  height: 30px;
  border-radius: 5px;
  color: #7b909d;
}
.avatar {
  width: 29px;
  height: 29px;
  font-size: 9px;
}
.workspace main {
  padding: 28px 30px 0;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 25px;
}
.eyebrow {
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 1.8px;
  color: #8a9c9f;
}
.page-heading .eyebrow {
  margin-bottom: 12px;
}
.page-heading p {
  margin-top: 9px;
  font-size: 11px;
}
.primary {
  background: #326a8a;
  color: white;
  padding: 11px 15px;
  border: 1px solid #326a8a;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 550;
  white-space: nowrap;
}
.primary:hover {
  background: #265672;
}
.secondary {
  border: 1px solid #d6e1dd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 11px;
  background: #fcfdfb;
}
.text-button {
  color: #3d7795;
  font-size: 11px;
  padding: 8px 2px;
}
.text-button svg {
  width: 15px;
}
.full {
  width: 100%;
  margin-top: 12px;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #fbfcfa;
  border: 1px solid var(--border);
  border-radius: 9px;
  margin-bottom: 24px;
  padding: 17px 0;
}
.metrics > div {
  padding: 0 23px;
  border-right: 1px solid var(--border);
}
.metrics > div:last-child {
  border: 0;
}
.metrics > div > span {
  font-size: 10px;
  color: #7a8d97;
}
.metrics strong {
  font-size: 26px;
  font-weight: 550;
  display: flex;
  gap: 9px;
  align-items: baseline;
  margin-top: 7px;
  line-height: 1.1;
}
.metrics small {
  font-size: 9px;
  margin-left: 5px;
  font-weight: 400;
  color: #93a0a5;
}
.metrics em {
  font-style: normal;
  font-size: 14px;
  color: #a3adb1;
  margin-left: -5px;
}
.text-amber {
  color: #ac8750 !important;
}
.text-green {
  color: #4d8c75 !important;
}
.text-blue {
  color: #517f99;
}
.garage-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 294px;
  gap: 20px;
  min-height: 640px;
}
.garage-layout.immersive {
  grid-template-columns: 1fr;
}
.immersive .context-panel {
  display: none;
}
.scene-card {
  background: #fafdfa;
  border: 1px solid #dce4df;
  border-radius: 9px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.scene-toolbar {
  height: 57px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  background: #fbfcfa;
}
.scene-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  white-space: nowrap;
}
.scene-title > span:last-child {
  color: #9ca9ae;
  font-size: 9px;
  border-left: 1px solid #dde4df;
  padding-left: 9px;
}
.live-dot {
  width: 5px;
  height: 5px;
  background: #7c9c88;
  border-radius: 100%;
}
.mode-switch {
  display: flex;
  padding: 3px;
  background: #eef2ef;
  border-radius: 6px;
  gap: 2px;
}
.mode-switch button {
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 9px;
  color: #7d919d;
}
.mode-switch button.selected {
  background: #fff;
  color: #355e78;
  box-shadow: 0 1px 3px #263e4b15;
}
.scene-viewport {
  position: relative;
  flex: 1;
  min-height: 555px;
  background: #d9e2df;
  overflow: hidden;
}
.canvas-host {
  position: absolute;
  inset: 0;
}
.canvas-host canvas {
  display: block;
  touch-action: none;
  outline: none;
}
.zone-menu {
  position: absolute;
  top: 17px;
  left: 18px;
  width: 154px;
  box-shadow: 0 4px 16px #263b4c10;
  background: #f9fcf7ed;
  border: 1px solid #ffffff77;
  border-radius: 6px;
  padding: 8px 10px;
}
.zone-menu label {
  font-size: 7px;
  letter-spacing: 1.4px;
  margin: 0 0 5px;
  color: #829493;
}
.zone-menu select {
  font-size: 11px;
  padding: 1px 0;
  background: transparent;
  border: none;
}
.scene-welcome {
  position: absolute;
  left: 22px;
  top: 95px;
  pointer-events: none;
  text-shadow: 0 1px 12px #ffffffc0;
}
.scene-welcome > span {
  font-size: 8px;
  letter-spacing: 1.6px;
  color: #657e86;
}
.scene-welcome h2 {
  font-size: 25px;
  line-height: 1.28;
  letter-spacing: -0.8px;
  color: #2c4c5d;
  margin-top: 12px;
}
.scene-welcome p {
  font-size: 10px;
  max-width: 210px;
  color: #65818b;
  margin-top: 10px;
}
.scene-welcome button {
  pointer-events: auto;
  background: #fcfffcf5;
  box-shadow: 0 4px 10px #253d4910;
  border: 1px solid #d3dfd8;
  border-radius: 5px;
  color: #3b657b;
  padding: 10px 11px;
  font-size: 10px;
  margin-top: 17px;
  text-shadow: none;
}
.scene-welcome button:hover {
  background: #fff;
}
.mini-map {
  position: absolute;
  left: 18px;
  bottom: 20px;
  width: 152px;
  border-radius: 7px;
  padding: 10px;
  background: #fafff9ef;
  border: 1px solid #fff;
  box-shadow: 0 5px 20px #1c364518;
}
.mini-map > div {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 7px;
  letter-spacing: 0.7px;
  color: #7b9199;
  margin-bottom: 7px;
}
.mini-map button {
  margin-left: auto;
  padding: 0;
}
.mini-map svg {
  display: block;
  width: 100%;
  max-height: 135px;
}
.mini-map svg g {
  cursor: pointer;
}
.mini-map svg g:hover circle {
  fill: #8faea4;
}
.scene-expand {
  position: absolute;
  bottom: 18px;
  right: 17px;
  background: #f9fff8e8;
  border: 1px solid #fff;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  color: #5a7886;
}
.scene-footer {
  height: 37px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  font-size: 9px;
  color: #7f959f;
  white-space: nowrap;
}
.scene-footer > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
}
.scene-footer .dot {
  width: 4px;
  height: 4px;
  margin-right: 4px;
}
.scene-footer > span:last-child {
  font-size: 8px;
  color: #98a7ac;
}
.context-panel {
  border: 1px solid #dfe6e1;
  border-radius: 9px;
  background: #fbfcfa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 690px;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e9e5;
  padding: 19px 18px;
  min-height: 58px;
}
.panel-top > span:first-child {
  font-size: 9px;
  letter-spacing: 1.2px;
  color: #79939e;
}
.panel-top strong {
  font-size: 12px;
  font-weight: 600;
}
.small-chip {
  font-size: 9px;
  padding: 5px 7px;
  background: #edf2ed;
  color: #7b9298;
  border-radius: 4px;
  white-space: nowrap;
}
.activity-intro {
  padding: 23px 20px 17px;
}
.activity-intro .eyebrow {
  font-size: 7px;
  letter-spacing: 1.3px;
}
.activity-intro h2 {
  font-size: 21px;
  line-height: 1.3;
  margin-top: 12px;
}
.activity-intro p {
  font-size: 10px;
  margin-top: 10px;
  color: #8c9b9f;
}
.search {
  display: flex;
  gap: 8px;
  align-items: center;
  border: 1px solid #e0e8e3;
  border-radius: 6px;
  background: #fff;
  padding: 0 10px;
  color: #98a8ab;
}
.search input {
  border: none;
  padding: 10px 0;
  font-size: 11px;
  background: none;
}
.context-panel > .search {
  margin: 0 18px 11px;
}
.vehicle-list {
  flex: 1;
  overflow: auto;
  padding: 0 17px;
}
.vehicle-preview {
  width: 100%;
  justify-content: flex-start;
  border-bottom: 1px solid #e5ebe5;
  gap: 11px;
  padding: 14px 0;
  text-align: left;
}
.preview-color {
  width: 40px;
  height: 39px;
  display: grid;
  place-items: center;
  color: #fff;
  border-radius: 6px;
  flex-shrink: 0;
  opacity: 0.8;
}
.vehicle-preview > div {
  flex: 1;
}
.vehicle-preview strong {
  font-size: 11px;
  display: block;
  font-weight: 600;
}
.vehicle-preview small {
  display: block;
  font-size: 8px;
  margin: 5px 0 7px;
  color: #8b999e;
}
.vehicle-preview small span {
  color: #9aabaf;
}
.vehicle-preview > svg {
  color: #9aafb9;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  font-size: 8px;
  border-radius: 4px;
  white-space: nowrap;
  font-weight: 500;
  line-height: 1;
}
.badge i {
  width: 4px;
  height: 4px;
  border-radius: 100%;
  background: currentColor;
}
.badge.blue {
  background: #e9f0f4;
  color: #4b7d98;
}
.badge.slate {
  background: #eef0ed;
  color: #859191;
}
.badge.amber {
  background: #f4efe3;
  color: #a58954;
}
.badge.green {
  background: #e8f1e9;
  color: #5d9676;
}
.panel-bottom {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 14px 19px;
  border-top: 1px solid var(--border);
  background: #f5f8f3;
  color: #8ba296;
  font-size: 9px;
  line-height: 1.5;
}
.vehicle-heading {
  padding: 22px 20px;
}
.car-avatar {
  height: 53px;
  width: 63px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  margin-bottom: 14px;
  opacity: 0.85;
}
.vehicle-heading h2 {
  font-size: 20px;
  margin-bottom: 11px;
}
.plate {
  display: inline-block;
  background: white;
  border: 1px solid #dce4e0;
  border-left: 5px solid #6f91a7;
  border-radius: 4px;
  font-size: 11px;
  letter-spacing: 1px;
  padding: 5px 7px;
  margin-right: 7px;
}
.panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  padding: 0 17px;
  gap: 17px;
}
.panel-tabs button {
  font-size: 10px;
  color: #899da5;
  padding: 11px 0;
}
.panel-tabs button.on {
  border-bottom: 2px solid #426e8c;
  color: #426e8c;
}
.panel-body {
  padding: 19px 20px;
  overflow: auto;
  flex: 1;
}
.panel-body label {
  font-size: 10px;
  margin-top: 16px;
}
.panel-body select,
.panel-body textarea {
  font-size: 11px;
  padding: 9px 10px;
}
.client-line {
  display: flex;
  align-items: center;
  gap: 10px;
}
.client-line svg {
  color: #7e98a5;
}
.client-line strong {
  font-size: 11px;
}
.client-line small {
  display: block;
  margin-top: 5px;
  font-size: 9px;
}
.vehicle-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 15px 0;
  border-bottom: 1px solid #e2e7e2;
  gap: 15px;
}
.vehicle-facts span {
  font-size: 9px;
  display: block;
  color: #879ba6;
  margin-bottom: 6px;
}
.vehicle-facts strong {
  font-size: 12px;
  font-weight: 500;
}
.symptoms {
  font-size: 11px;
  color: #637b87;
  line-height: 1.6;
  background: #f0f4ef;
  border-radius: 5px;
  padding: 9px;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 8px !important;
  font-size: 11px !important;
  line-height: 1.6;
}
.check-label input {
  width: 15px;
  height: 15px;
  accent-color: #3f738e;
}
.subtle-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 14px;
  border: 1px solid #d9e5df;
  background: #f0f6ef;
  color: #79918a;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.6;
  margin: 12px 0;
}
.subtle-note svg {
  flex-shrink: 0;
  margin-top: 2px;
}
.panel-body .subtle-note {
  font-size: 10px;
  margin-top: 0;
}
.parts-selector {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 17px 0;
}
.parts-selector button {
  text-align: left;
  justify-content: flex-start;
  padding: 9px 11px;
  border: 1px solid #dce4df;
  border-radius: 5px;
  font-size: 11px;
}
.parts-selector button.on {
  background: #e7f0f2;
  color: #447895;
  border-color: #aac5ce;
}
.part-detail h3 {
  margin: 12px 0 9px;
}
.part-detail code {
  font-size: 10px;
  color: #8198a3;
}
.warning-small {
  font-size: 10px;
  margin: 12px 0;
  color: #a18c68;
}
.part-price {
  font-size: 21px;
  font-weight: 500;
  display: block;
  margin: 18px 0;
}
.part-price small {
  font-size: 9px;
  color: #92a4ae;
}
.timeline {
  padding-left: 14px;
  margin-top: 20px;
}
.timeline > div {
  position: relative;
  padding: 0 0 20px 14px;
  border-left: 1px solid #dce5dc;
}
.timeline i {
  width: 7px;
  height: 7px;
  background: #83a499;
  border: 2px solid #dce9e3;
  border-radius: 50%;
  position: absolute;
  left: -4px;
  top: 4px;
}
.timeline strong {
  font-size: 11px;
}
.timeline small {
  display: block;
  font-size: 9px;
  margin-top: 5px;
}
.message {
  background: #f0f4ed;
  border: 1px solid #dbe5d9;
  border-radius: 6px;
  padding: 13px;
  margin-top: 15px;
}
.message > span {
  font-size: 8px;
  letter-spacing: 1px;
  color: #7e978c;
}
.message p {
  font-size: 11px;
  line-height: 1.8;
  margin: 10px 0;
}
.content-card {
  background: #fbfcfa;
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 24px;
  min-width: 0;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}
.section-head h2 {
  font-size: 18px;
}
.section-head h2 span {
  font-size: 11px;
  color: #8099a2;
  background: #edf2ec;
  margin-left: 6px;
  padding: 3px 7px;
  border-radius: 4px;
}
.section-head > span {
  font-size: 10px;
  color: #80939c;
}
.section-head .search {
  width: 280px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
th {
  text-align: left;
  font-weight: 500;
  font-size: 9px;
  color: #8d9eaa;
  border-bottom: 1px solid #dce5df;
  padding: 12px 10px;
  background: #f2f6f0;
}
td {
  padding: 17px 10px;
  border-bottom: 1px solid #e4eae5;
}
td strong {
  font-size: 12px;
}
td small {
  display: block;
  font-size: 9px;
  margin-top: 5px;
}
td .badge {
  font-size: 9px;
}
tbody tr:hover {
  background: #f3f6f1;
}
.table-scroll {
  overflow: auto;
}
.table-scroll + .section-head {
  margin-top: 30px;
}
.empty {
  text-align: center;
  padding: 25px;
  font-size: 12px;
}
.empty svg {
  color: #9caeae;
}
.planning-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}
.planning-bay {
  border: 1px solid #dce5de;
  border-radius: 7px;
  overflow: hidden;
}
.planning-bay > div:first-child {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f0f4ef;
  border-bottom: 1px solid #dfe6df;
  font-size: 10px;
}
.planning-bay > div:first-child > span {
  font-size: 9px;
}
.planning-bay > button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  width: 100%;
  padding: 20px 14px;
  gap: 9px;
  min-height: 213px;
}
.planning-bay > button > svg {
  color: #668a99;
}
.planning-bay > button strong {
  font-size: 13px;
}
.planning-bay > button > span:not(.badge) {
  font-size: 10px;
  color: #8499a3;
}
.planning-bay .due {
  display: flex;
  gap: 5px;
  align-items: center;
  border-top: 1px solid #e2e9e0;
  width: 100%;
  padding-top: 12px;
}
.free-bay {
  padding: 22px 14px;
  color: #91aa9a;
  font-size: 11px;
  min-height: 213px;
}
.free-bay p {
  font-size: 11px;
  margin: 9px 0 17px;
}
.free-bay .secondary {
  font-size: 9px;
}
.order-row {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 11px;
  border-bottom: 1px solid #e2e9e0;
  padding: 17px 0;
}
.order-row > span {
  color: #8d9b9f;
  margin-left: auto;
}
.order-row svg {
  color: #7d9aa7;
}
.intelligence-layout {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 24px;
  align-items: start;
}
.diagnostic {
  padding: 30px;
  position: sticky;
  top: 20px;
}
.brain-icon {
  width: 58px;
  height: 58px;
  background: #eaf1eb;
  color: #608b80;
  border-radius: 13px;
  display: grid;
  place-items: center;
  margin-bottom: 27px;
}
.diagnostic .eyebrow {
  font-size: 8px;
}
.diagnostic h2 {
  font-size: 28px;
  line-height: 1.3;
  margin: 14px 0;
}
.diagnostic p {
  font-size: 12px;
}
.diagnostic textarea {
  min-height: 140px;
  font-size: 12px;
  margin-bottom: 17px;
}
.diagnostic .subtle-note {
  font-size: 10px;
  margin-top: 25px;
}
.case-card {
  padding: 23px 26px;
  background: #fcfdfb;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 16px;
}
.case-card > div:first-child {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}
.case-card > div:first-child > span:last-child {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 8px;
}
.case-card h3 {
  font-size: 17px;
  margin-bottom: 7px;
}
.case-card p {
  font-size: 11px;
}
.case-card ul {
  padding-left: 19px;
  font-size: 11px;
  line-height: 1.9;
  color: #7e939b;
  margin-top: 8px;
}
.case-result {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  border-top: 1px solid #e1e9dd;
  padding-top: 15px;
  color: #769784;
  font-size: 10px;
  line-height: 1.6;
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.team-grid article {
  border: 1px solid #e0e7e1;
  border-radius: 8px;
  padding: 20px 17px;
}
.large-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e4ede7;
  color: #688983;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 17px;
}
.team-grid h3 {
  font-size: 14px;
}
.team-grid p {
  font-size: 10px;
  margin: 7px 0 17px;
}
.team-task {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  gap: 8px;
  text-align: left;
  margin-top: 17px;
  border-top: 1px solid var(--border);
  padding-top: 15px;
  font-size: 10px;
}
.team-task > svg {
  flex-shrink: 0;
  color: #94a9ac;
  width: 16px;
}
.team-task > svg:last-child {
  margin-left: auto;
}
.team-task small {
  display: block;
  font-size: 8px;
  margin-top: 5px;
}
.director-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-bottom: 30px;
}
.director-grid article {
  padding: 21px;
  border: 1px solid var(--border);
  border-radius: 7px;
}
.director-grid h3 {
  margin-bottom: 20px;
}
.status-bar {
  display: grid;
  grid-template-columns: 115px 1fr 18px;
  gap: 12px;
  margin: 15px 0;
  align-items: center;
  font-size: 10px;
  color: #8b9aa3;
}
.status-bar > div {
  height: 6px;
  border-radius: 3px;
  background: #ebf1e9;
  overflow: hidden;
}
.status-bar i {
  display: block;
  height: 100%;
  background: #7eaaa1;
  min-width: 0;
}
.status-bar strong {
  text-align: right;
  color: #627f8f;
}
.alert-row {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #e2e9df;
  padding: 15px 0;
  color: #b1986b;
}
.alert-row strong {
  font-size: 11px;
  color: #5f7987;
}
.alert-row small {
  font-size: 9px;
  display: block;
  margin-top: 5px;
}
.alert-row button {
  margin-left: auto;
}
.audit-list > div {
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #e4eae2;
  padding: 16px 0;
  font-size: 11px;
}
.audit-list svg {
  color: #85a397;
}
.audit-list small {
  display: block;
  font-size: 9px;
  margin-top: 5px;
}
.audit-list time {
  margin-left: auto;
  font-size: 10px;
  color: #8a9fa7;
}
.settings {
  max-width: 820px;
  padding: 30px;
}
.settings h2 {
  font-size: 18px;
  margin-bottom: 15px;
}
.settings p {
  font-size: 12px;
  margin-bottom: 18px;
}
.settings h2:not(:first-child) {
  margin-top: 30px;
}
.settings input[type="range"] {
  max-width: 320px;
  display: block;
  padding: 0;
  margin-bottom: 20px;
  accent-color: #386e8b;
}
.import-label {
  font-size: 11px;
  margin: 22px 0;
}
.import-label input {
  display: block;
  margin-top: 8px;
  font-size: 11px;
}
.danger {
  color: #aa6d64;
  border: 1px solid #e3d4cd;
  border-radius: 6px;
  padding: 10px 13px;
  font-size: 11px;
}
.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 21px 0;
  color: #9dabb0;
  font-size: 9px;
}
.app-footer > span {
  display: flex;
  align-items: center;
  gap: 7px;
}
.crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 7px;
  border: 1px solid white;
  border-radius: 50%;
  box-shadow: 0 0 2px black;
  pointer-events: none;
}
.walking-tip {
  position: absolute;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  background: #203c4de0;
  color: #d9e5e6;
  padding: 12px 18px;
  border-radius: 7px;
  font-size: 10px;
  line-height: 2;
  max-width: 460px;
  width: 55%;
}
kbd {
  background: #3c5866;
  border: 1px solid #64818e;
  border-radius: 3px;
  font: 9px inherit;
  padding: 2px 4px;
}
.touch-controls {
  display: flex;
  position: absolute;
  right: 20px;
  bottom: 70px;
  gap: 4px;
}
.touch-controls button {
  background: #ffffffdc;
  border-radius: 5px;
  min-width: 33px;
  height: 36px;
  touch-action: none;
}
.notice {
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8efdf;
  border: 1px solid #e5d4b6;
  border-radius: 7px;
  margin-bottom: 20px;
  color: #9c8154;
  font-size: 11px;
}
.notice button {
  margin-left: auto;
  text-decoration: underline;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: #152f4066;
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px;
}
.modal {
  width: 620px;
  max-width: 100%;
  max-height: 90dvh;
  overflow: auto;
  background: #fbfcfa;
  padding: 28px;
  border: 1px solid #e4e9e0;
  border-radius: 12px;
  box-shadow: 0 20px 80px #12334a25;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-head h2 {
  margin-top: 9px;
  font-size: 24px;
}
.modal > p {
  font-size: 11px;
  margin: 14px 0 7px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 18px;
}
.modal label {
  font-size: 10px;
}
.modal input,
.modal textarea,
.modal select {
  font-size: 12px;
  margin-top: 7px;
}
.modal-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 25px;
}
.modal-bottom > span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #81978f;
}
.toast {
  position: fixed;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 90vw;
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #203e50;
  color: white;
  border: 1px solid #4d6c7c;
  box-shadow: 0 5px 30px #203d4920;
  padding: 14px 18px;
  border-radius: 8px;
  font-size: 12px;
}
.toast > svg {
  flex-shrink: 0;
  color: #aacbc2;
}
.toast button {
  color: #abc0c5;
}
.vehicle-row {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  padding: 15px 0;
  width: 100%;
  flex-wrap: wrap;
}
.vehicle-row strong {
  font-size: 12px;
}
.vehicle-row small {
  display: block;
  margin-top: 5px;
  font-size: 9px;
}
@media (min-width: 1700px) {
  .garage-layout {
    min-height: 740px;
    grid-template-columns: minmax(0, 1fr) 330px;
  }
  .scene-viewport {
    min-height: 650px;
  }
  .context-panel {
    max-height: 790px;
  }
  .workspace main {
    padding: 35px 40px 0;
  }
  .scene-welcome h2 {
    font-size: 32px;
  }
  .scene-welcome {
    top: 115px;
    left: 28px;
  }
  .scene-welcome p {
    font-size: 12px;
  }
}
@media (max-width: 1250px) {
  .sidebar {
    width: 196px;
    padding: 22px 11px 0;
  }
  .workspace {
    margin-left: 196px;
    width: calc(100% - 196px);
  }
  .workspace main {
    padding: 24px 20px 0;
  }
  .topbar {
    padding: 0 20px;
  }
  .garage-layout {
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: 14px;
  }
  .metrics > div {
    padding: 0 18px;
  }
  .metrics small {
    display: none;
  }
  .scene-title > span:last-child {
    display: none;
  }
  .scene-welcome h2 {
    font-size: 21px;
  }
  .scene-welcome p {
    max-width: 160px;
    font-size: 9px;
  }
  .scene-welcome {
    left: 18px;
  }
  .mode-switch button {
    padding: 5px 6px;
  }
  .mode-switch span {
    display: none;
  }
  .planning-grid,
  .team-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .page-heading h1 {
    font-size: 24px;
  }
  .page-heading p {
    font-size: 10px;
  }
}
@media (max-width: 1000px) {
  .sidebar {
    width: 72px;
    padding: 22px 8px 0;
  }
  .brand {
    padding: 0 10px 30px;
  }
  .brand > span:last-child,
  .garage-name,
  .nav-caption,
  .nav-item > span,
  .nav-count,
  .local-card,
  .user > div,
  .user button {
    display: none;
  }
  .nav-item {
    justify-content: center;
    font-size: 0;
    padding: 13px;
  }
  .nav-item svg {
    flex-shrink: 0;
  }
  .nav-item .new-dot {
    display: none;
  }
  .user {
    justify-content: center;
  }
  .sidebar-bottom > .nav-item {
    font-size: 0;
  }
  .workspace {
    margin-left: 72px;
    width: calc(100% - 72px);
  }
  .garage-layout {
    grid-template-columns: minmax(0, 1fr) 270px;
  }
  .scene-welcome {
    top: 95px;
  }
  .scene-welcome h2 {
    font-size: 19px;
  }
  .scene-welcome > span {
    font-size: 7px;
  }
  .scene-welcome p {
    display: none;
  }
  .scene-welcome button {
    font-size: 9px;
  }
  .scene-footer > span:last-child {
    display: none;
  }
  .intelligence-layout {
    grid-template-columns: 1fr;
  }
  .diagnostic {
    position: static;
  }
  .director-grid {
    grid-template-columns: 1fr;
  }
  .scene-viewport {
    min-height: 590px;
  }
}
@media (max-width: 760px) {
  .workspace main {
    padding: 22px 14px 0;
  }
  .topbar {
    height: 58px;
    padding: 0 14px;
  }
  .breadcrumbs {
    font-size: 9px;
    gap: 6px;
  }
  .top-actions {
    gap: 8px;
  }
  .demo {
    font-size: 8px;
    padding: 4px 6px;
  }
  .top-actions .avatar {
    display: none;
  }
  .page-heading {
    display: block;
  }
  .page-heading h1 {
    font-size: 23px;
  }
  .page-heading p {
    font-size: 11px;
  }
  .page-heading > .primary {
    margin-top: 17px;
  }
  .metrics {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    padding: 15px 0;
    margin-bottom: 17px;
  }
  .metrics > div:nth-child(2) {
    border: none;
  }
  .metrics strong {
    font-size: 24px;
  }
  .metrics > div > span {
    font-size: 9px;
  }
  .garage-layout {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .scene-viewport {
    min-height: 540px;
  }
  .context-panel {
    max-height: 650px;
  }
  .vehicle-list {
    max-height: 310px;
  }
  .scene-welcome h2 {
    font-size: 22px;
  }
  .scene-welcome p {
    display: block;
    font-size: 10px;
    max-width: 180px;
  }
  .scene-welcome button {
    font-size: 10px;
  }
  .scene-toolbar {
    padding: 0 11px;
  }
  .scene-title {
    font-size: 9px;
  }
  .mini-map {
    width: 125px;
  }
  .mini-map svg {
    max-height: 110px;
  }
  .section-head {
    flex-wrap: wrap;
    gap: 12px;
  }
  .section-head .search {
    width: 100%;
  }
  .content-card {
    padding: 18px;
  }
  .team-grid,
  .planning-grid {
    grid-template-columns: 1fr;
  }
  .app-footer {
    font-size: 8px;
    gap: 10px;
    align-items: flex-start;
  }
  .app-footer > span:last-child {
    display: none;
  }
  .order-row {
    flex-wrap: wrap;
    gap: 10px;
  }
  .order-row > span {
    margin-left: 0;
  }
  .order-row .secondary {
    margin-left: auto;
  }
  .modal-backdrop {
    padding: 12px;
  }
  .modal {
    padding: 22px 18px;
  }
  .modal-head h2 {
    font-size: 20px;
  }
  .form-grid {
    gap: 0 12px;
  }
  .walking-tip {
    width: 75%;
    bottom: 190px;
    font-size: 9px;
  }
  .touch-controls {
    right: 10px;
    bottom: 50px;
  }
  .toast {
    font-size: 11px;
  }
  .diagnostic {
    padding: 23px;
  }
  .diagnostic h2 {
    font-size: 24px;
  }
  .case-card {
    padding: 20px;
  }
  .case-card > div:first-child {
    flex-wrap: wrap;
  }
  .scene-footer {
    font-size: 8px;
  }
  .immersive .context-panel {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
/* Atelier: six large actions, independent of WebGL. */
.sidebar nav {
  overflow: auto;
  min-height: 0;
}
.sidebar-bottom {
  flex-shrink: 0;
}
.reception-tools {
  display: flex;
  gap: 10px;
  margin: 16px 0;
  flex-wrap: wrap;
}
.identification-result {
  background: #eef4ed;
  border: 1px solid #dce7d9;
  border-radius: 7px;
  padding: 14px;
  margin: 12px 0;
  font-size: 11px;
}
.identification-result p {
  margin: 8px 0;
}
.modal.scan-open {
  width: 1100px;
}
.scan-panel {
  border: 1px solid #dce6df;
  border-radius: 9px;
  padding: 18px;
  margin: 15px 0;
  background: #f3f7f1;
}
.scan-upload {
  border: 1px dashed #a9c0b4;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px;
  position: relative;
  background: #fafdf7;
  border-radius: 7px;
  margin-bottom: 20px;
  cursor: pointer;
}
.scan-upload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.scan-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 23px;
}
.scan-tools {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
}
.scan-tools label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}
.scan-tools input {
  width: 100px;
}
.document-preview {
  height: 450px;
  overflow: auto;
  background: #d7e1d8;
  border: 1px solid #ccd9ce;
  border-radius: 7px;
  text-align: center;
  padding: 15px;
}
.document-preview img {
  width: 100%;
  transform-origin: center;
}
.document-preview > p {
  padding: 150px 10px;
}
.scan-fields {
  max-height: 760px;
  overflow: auto;
  padding-right: 8px;
}
.scan-fields > p {
  font-size: 10px;
  margin: 10px 0;
}
.scan-field {
  border-bottom: 1px solid #dfe6dc;
  padding: 7px 0;
}
.scan-field > label:first-child {
  margin: 4px 0;
}
.scan-field input {
  padding: 8px;
}
.scan-field small {
  display: block;
  margin-top: 6px;
  overflow-wrap: anywhere;
}
.scan-field.confirmed {
  border-left: 3px solid #7ca891;
  padding-left: 10px;
}
.scan-field .check-label {
  font-size: 10px !important;
  margin: 8px 0;
}
.scan-progress {
  font-size: 11px;
  margin-top: 10px;
}
.scan-panel .warning-small svg {
  vertical-align: middle;
  margin-right: 5px;
}
.workshop-picker {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.workshop-picker > button {
  justify-content: flex-start;
  text-align: left;
  border: 1px solid #d8e4db;
  border-radius: 8px;
  padding: 22px;
  gap: 16px;
  min-height: 110px;
  background: #f5f8f1;
}
.workshop-picker strong {
  display: block;
  font-size: 17px;
}
.workshop-picker span {
  display: block;
  font-size: 12px;
  color: #70909c;
  margin: 8px 0;
}
.workshop-picker small {
  display: block;
}
.workshop-picker > button > svg:last-child {
  margin-left: auto;
  color: #8aaa9d;
}
.workshop-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}
.workshop-top > div {
  text-align: center;
}
.workshop-top h2 {
  font-size: 26px;
  margin-bottom: 9px;
}
.workshop-top > div > span:last-child {
  font-size: 11px;
  color: #789394;
}
.workshop-summary {
  background: #203c4b;
  border: 1px solid #385564;
  border-radius: 9px;
  padding: 19px 23px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #b6d1d1;
  font-size: 12px;
  margin-bottom: 20px;
  gap: 20px;
}
.workshop-summary > span {
  display: flex;
  align-items: center;
  gap: 12px;
}
.workshop-summary strong {
  font-size: 23px;
  letter-spacing: 1px;
  color: #fff;
}
.workshop-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 22px;
}
.work-action {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  padding: 25px 24px;
  min-height: 165px;
  background: #fbfdf9;
  border: 1px solid #d6e2d8;
  border-radius: 10px;
  cursor: pointer;
  margin: 0;
  font-weight: 400;
}
.work-action:hover {
  background: #eaf3e9;
}
.work-action svg {
  color: #5d8294;
}
.work-action strong {
  font-size: 18px;
  font-weight: 600;
}
.work-action span {
  font-size: 11px;
  color: #829b9b;
}
.work-action.start,
.work-action.finish {
  background: #e9f3e9;
  border-color: #b6cfb9;
}
.work-action.start svg,
.work-action.finish svg {
  color: #5b9976;
}
.work-action.pause {
  background: #f3efe4;
  border-color: #d6c79f;
}
.work-action.pause svg {
  color: #a2874f;
}
.photo-action {
  position: relative;
}
.photo-action input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.workshop-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  margin-top: 22px;
}
.workshop-detail .check-label {
  padding: 12px 0;
  font-size: 13px !important;
  cursor: pointer;
}
.workshop-detail input[type="checkbox"] {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}
.workshop-detail h3 {
  margin-bottom: 16px;
}
.workshop-log {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-bottom: 1px solid #dfe8db;
  padding: 14px 0;
  color: #668590;
  font-size: 12px;
  line-height: 1.5;
}
.workshop-log svg {
  flex-shrink: 0;
  margin-top: 2px;
}
.workshop-log small {
  display: block;
  margin-top: 5px;
  font-size: 10px;
}
.workshop-log.issue {
  color: #a18956;
}
.workshop-photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 20px;
}
.workshop-photos img {
  width: 100%;
  border-radius: 7px;
}
.part-request-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.part-request-grid button {
  flex-direction: column;
  padding: 20px;
  font-size: 12px;
}
.part-request-grid span {
  font-size: 11px;
  color: #85a291;
}
.workshop-screen > .content-card textarea {
  margin: 16px 0;
}
.qr-panel {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 28px;
  border: 1px solid #d8e3d9;
  background: white;
  border-radius: 9px;
  margin-top: 23px;
}
.qr-panel img {
  width: 220px;
  height: 220px;
}
.qr-panel p {
  font-size: 11px;
  margin: 12px 0;
}
.catalogue-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}
.catalogue-stats > div {
  background: #fbfdf8;
  border: 1px solid #d9e4d9;
  border-radius: 8px;
  padding: 20px;
}
.catalogue-stats strong {
  display: block;
  font-size: 27px;
  font-weight: 500;
}
.catalogue-stats span {
  display: block;
  color: #849d99;
  font-size: 10px;
  margin-top: 8px;
}
.catalogue-stats small {
  font-size: 14px;
}
.library-layout {
  display: grid;
  grid-template-columns: 1fr 325px;
  gap: 20px;
}
.library-layout .section-head {
  gap: 12px;
}
.library-layout .section-head > .search {
  width: auto;
  flex: 1;
}
.library-layout .section-head > select {
  width: 130px;
  font-size: 11px;
}
.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.asset-tile {
  border: 1px solid #e0e8dc;
  border-radius: 8px;
  padding: 15px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.asset-tile.selected {
  border-color: #79a3b0;
  background: #edf4f1;
}
.asset-tile img {
  height: 85px;
  max-width: 100%;
  object-fit: contain;
  image-rendering: auto;
}
.asset-tile strong {
  font-size: 11px;
  text-transform: capitalize;
}
.asset-tile span {
  font-size: 10px;
  color: #90a29b;
}
.asset-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 85px;
  color: #99ada6;
}
.asset-detail {
  padding: 18px;
  align-self: start;
}
.model-preview {
  height: 220px;
  position: relative;
  border: 1px solid #dbe5dc;
  border-radius: 7px;
  overflow: hidden;
  margin-bottom: 22px;
}
.model-preview canvas {
  display: block;
  touch-action: none;
}
.model-preview > span {
  position: absolute;
  inset: 30px;
  font-size: 11px;
}
.asset-detail h2 {
  text-transform: capitalize;
  margin: 12px 0;
}
.asset-detail dl {
  display: grid;
  grid-template-columns: 100px 1fr;
  font-size: 11px;
  line-height: 1.5;
  gap: 10px;
  margin: 22px 0;
}
.asset-detail dt {
  color: #94a399;
}
.asset-detail dd {
  margin: 0;
  color: #657f7e;
}
.asset-hash {
  font-size: 8px;
  overflow-wrap: anywhere;
  line-height: 1.7;
  margin: 12px 0;
}
.asset-blocked {
  min-height: 160px;
  text-align: center;
  padding: 30px;
  color: #ae9167;
}
.asset-blocked p {
  font-size: 11px;
  margin-top: 12px;
}
.quotes-layout {
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 22px;
  align-items: start;
}
.quote-list {
  padding: 20px;
}
.quote-list h2 {
  font-size: 17px;
}
.quote-list .section-head {
  gap: 6px;
  flex-wrap: wrap;
}
.quote-pending {
  display: flex;
  justify-content: flex-start;
  text-align: left;
  width: 100%;
  gap: 10px;
  padding: 15px 0;
  border-bottom: 1px solid #e0e8db;
  font-size: 11px;
  color: #789097;
}
.quote-pending small {
  display: block;
  font-size: 9px;
  margin-top: 7px;
}
.quote-pending svg {
  flex-shrink: 0;
}
.quote-pending svg:last-child {
  margin-left: auto;
}
.quote-pending.on {
  color: #477e94;
}
.quote-lines input {
  padding: 8px;
  font-size: 11px;
  min-width: 75px;
}
.quote-lines th:first-child {
  width: 40%;
}
.quote-lines td {
  padding: 12px 5px;
}
.quote-editor .notice {
  font-size: 10px;
}
.quote-editor .section-head p {
  font-size: 11px;
  margin-top: 8px;
}
.quote-totals {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  margin: 22px 0;
}
.quote-totals label {
  max-width: 130px;
}
.quote-totals > div > span {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #e0e6dc;
  padding: 12px 0;
  font-size: 12px;
  color: #92a198;
}
.quote-totals strong {
  color: #406978;
  font-weight: 550;
}
.quote-totals > div > span:last-child {
  font-size: 17px;
}
.quote-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin: 22px 0;
}
.quote-actions > span {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 8px;
}
@media (max-height: 900px) {
  .local-card {
    display: none;
  }
  .sidebar-bottom {
    padding-top: 12px;
  }
  .sidebar nav {
    flex: 1;
    scrollbar-width: thin;
  }
}
@media (max-width: 1100px) {
  .library-layout {
    grid-template-columns: 1fr 280px;
  }
  .asset-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .quotes-layout {
    grid-template-columns: 240px 1fr;
  }
  .work-action strong {
    font-size: 15px;
  }
  .work-action {
    padding: 22px 18px;
  }
  .workshop-summary > span:last-child {
    display: none;
  }
  .scan-columns {
    gap: 16px;
  }
  .document-preview {
    height: 350px;
  }
}
@media (max-width: 760px) {
  .workshop-picker {
    grid-template-columns: 1fr;
  }
  .workshop-actions {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .work-action {
    padding: 21px 15px;
    min-height: 160px;
  }
  .work-action strong {
    font-size: 14px;
  }
  .work-action span {
    font-size: 9px;
  }
  .workshop-top {
    flex-wrap: wrap;
  }
  .workshop-top > div {
    order: -1;
    width: 100%;
    text-align: left;
  }
  .workshop-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  .workshop-detail,
  .library-layout,
  .quotes-layout,
  .scan-columns {
    grid-template-columns: 1fr;
  }
  .catalogue-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .asset-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .asset-detail {
    width: 100%;
  }
  .asset-detail dl {
    grid-template-columns: 110px 1fr;
  }
  .part-request-grid {
    grid-template-columns: 1fr;
  }
  .qr-panel {
    flex-direction: column;
  }
  .document-preview {
    height: 300px;
  }
  .scan-fields {
    max-height: 450px;
  }
  .quote-totals {
    gap: 20px;
  }
  .scan-panel {
    padding: 12px;
  }
  .scan-panel .section-head {
    gap: 12px;
  }
  .scan-tools {
    flex-wrap: wrap;
  }
  .modal.scan-open {
    width: 100%;
  }
  .workshop-top h2 {
    font-size: 22px;
  }
  .quote-editor .section-head {
    flex-wrap: wrap;
  }
}
@media print {
  body {
    background: white;
  }
  .sidebar,
  .topbar,
  .page-heading,
  .metrics,
  .app-footer,
  .quote-list,
  .quote-actions,
  button,
  .quote-editor > p.warning-small {
    display: none !important;
  }
  .workspace {
    margin: 0;
    width: 100%;
  }
  .workspace main {
    padding: 0;
  }
  .quotes-layout {
    display: block;
  }
  .content-card {
    border: 0;
  }
  .quote-editor input {
    border: none;
    padding: 0;
  }
  .quote-editor .notice {
    display: block;
  }
  .quote-editor {
    padding: 10mm;
  }
}
.scan-examples {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
  font-size: 10px;
  color: #82948c;
}
.scan-examples .secondary {
  font-size: 10px;
  padding: 8px 10px;
}
.cohort-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #e9f1e7;
  border: 1px solid #d4e3d2;
  padding: 10px 16px;
  border-radius: 7px;
  margin-bottom: 18px;
  font-size: 12px;
}
.planning-v2 .section-head h2 {
  margin-top: 10px;
}
.planning-controls {
  display: flex;
  align-items: center;
  gap: 14px;
}
.planning-controls > input {
  width: 150px;
  font-size: 12px;
}
.planning-controls label {
  margin: 0;
}
.planning-tabs {
  display: flex;
  gap: 6px;
  margin: 16px 0;
}
.planning-tabs button {
  padding: 11px 18px;
  border: 1px solid #d8e4da;
  border-radius: 6px;
  font-size: 12px;
}
.planning-tabs button.on {
  background: #2c5269;
  color: white;
  border-color: #2c5269;
}
.planning-help {
  font-size: 11px;
  margin: 12px 0 18px;
}
.schedule-board {
  border: 1px solid #dce5dd;
  background: #fbfdf9;
  border-radius: 9px;
  overflow: hidden;
}
.schedule-lane {
  display: grid;
  grid-template-columns: 175px 1fr;
  border-bottom: 1px solid #e0e8de;
  min-height: 130px;
}
.schedule-lane:last-child {
  border-bottom: 0;
}
.lane-person {
  padding: 21px 18px;
  background: #f1f5ed;
  border-right: 1px solid #dfe6db;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.lane-person strong {
  font-size: 14px;
}
.lane-person small {
  font-size: 10px;
  line-height: 1.5;
}
.lane-person span {
  font-size: 10px;
  color: #738f7d;
}
.lane-jobs {
  display: flex;
  gap: 13px;
  padding: 14px;
  overflow-x: auto;
  align-items: stretch;
}
.schedule-card {
  min-width: 230px;
  max-width: 330px;
  flex: 0 0 265px;
  padding: 13px;
  border: 1px solid #bdd1d6;
  border-left: 4px solid #6c9bad;
  border-radius: 6px;
  background: #eff5f3;
  cursor: grab;
}
.schedule-card.blocked {
  border-color: #d8c9a9;
  border-left-color: #bba16c;
  background: #f7f3e9;
}
.schedule-card.complete {
  border-color: #d6e5d3;
  background: #edf4e9;
  border-left-color: #8bb18f;
  opacity: 0.8;
}
.schedule-card > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9px;
  color: #7c949c;
  gap: 10px;
}
.schedule-card h3 {
  font-size: 13px;
  margin: 10px 0 6px;
}
.schedule-card > small {
  font-size: 9px;
  display: block;
  line-height: 1.5;
  max-height: 30px;
  overflow: hidden;
}
.schedule-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #75939d;
  margin: 12px 0;
}
.schedule-actions {
  display: flex;
  justify-content: space-between;
}
.schedule-actions button {
  font-size: 10px;
  color: #46748a;
  padding: 6px 0;
}
.schedule-warning {
  font-size: 9px;
  color: #a0895e;
  line-height: 1.5;
  display: flex;
  gap: 5px;
  border-top: 1px solid #e5d9bd;
  padding-top: 9px;
  margin-top: 7px;
}
.schedule-warning svg {
  flex-shrink: 0;
}
.lane-free {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 25px;
  color: #92a58f;
  font-size: 11px;
  flex: 1;
}
.planning-editor {
  margin-top: 20px;
}
.planning-editor > .primary {
  margin-top: 20px;
}
.planning-editor .subtle-note {
  align-items: center;
}
.team-v2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.team-profile {
  border: 1px solid #d8e3d8;
  border-radius: 9px;
  padding: 23px;
  background: #fcfdfa;
}
.team-profile-top {
  display: flex;
  align-items: center;
  gap: 13px;
}
.team-profile-top > span {
  height: 48px;
  width: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 14px;
}
.team-profile-top p {
  font-size: 10px;
  margin-top: 6px;
}
.team-profile-top i {
  margin-left: auto;
  width: 7px;
  height: 7px;
  border-radius: 100%;
  background: #a4b8a5;
}
.team-profile-top i.working {
  background: #c7a264;
}
.team-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 18px 0;
}
.team-skills span {
  font-size: 9px;
  color: #7b948d;
  padding: 5px 7px;
  border: 1px solid #e0e8dc;
  border-radius: 5px;
}
.team-numbers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 18px 0;
  border-top: 1px solid #e4e9df;
  border-bottom: 1px solid #e4e9df;
}
.team-numbers strong {
  font-size: 18px;
  font-weight: 550;
}
.team-numbers small {
  display: block;
  font-size: 9px;
  margin-top: 7px;
}
.team-quality {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: #799983;
  margin-top: 15px;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 23px;
}
.dashboard-metric {
  background: #fbfdf8;
  border: 1px solid #d7e4d8;
  border-radius: 8px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  min-height: 130px;
}
.dashboard-metric > svg:first-child {
  color: #78988b;
}
.dashboard-metric > svg:last-child {
  position: absolute;
  right: 13px;
  bottom: 13px;
  color: #91aaa0;
}
.dashboard-metric strong {
  font-size: 29px;
  font-weight: 550;
}
.dashboard-metric span {
  font-size: 10px;
  color: #819990;
}
.manager-alert {
  display: flex;
  align-items: center;
  text-align: left;
  gap: 12px;
  width: 100%;
  padding: 16px 0;
  border-bottom: 1px solid #e0e8dc;
  justify-content: flex-start;
}
.manager-alert > svg {
  color: #b5a177;
  flex-shrink: 0;
}
.manager-alert strong {
  font-size: 11px;
  line-height: 1.5;
}
.manager-alert small {
  display: block;
  font-size: 9px;
  margin-top: 6px;
}
.manager-alert > svg:last-child {
  margin-left: auto;
  color: #96aba0;
}
.manager-alert.ready > svg {
  color: #7aa48a;
}
.turnover {
  font-size: 28px !important;
  margin: 27px 0 12px !important;
}
.pilotage-v2 .director-grid article {
  padding: 23px;
}
.pilotage-v2 .director-grid p {
  font-size: 11px;
  line-height: 1.7;
}
@media (max-width: 1000px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .schedule-lane {
    grid-template-columns: 135px 1fr;
  }
  .lane-person {
    padding: 18px 12px;
  }
}
@media (max-width: 760px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .team-v2 {
    grid-template-columns: 1fr;
  }
  .schedule-lane {
    display: block;
  }
  .lane-person {
    border-right: 0;
    border-bottom: 1px solid #e1e8da;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .lane-person span {
    margin-left: auto;
  }
  .planning-tabs {
    overflow: auto;
  }
  .planning-tabs button {
    white-space: nowrap;
    font-size: 11px;
    padding: 9px 12px;
  }
  .schedule-card {
    flex-basis: 240px;
  }
  .planning-controls {
    flex-wrap: wrap;
  }
  .planning-help {
    font-size: 10px;
  }
  .cohort-bar {
    flex-wrap: wrap;
    gap: 8px;
  }
}
.clickable-metrics > button {
  display: block;
  text-align: left;
  padding: 0 23px;
  border-right: 1px solid var(--border);
  border-radius: 0;
}
.clickable-metrics > button:last-child {
  border-right: 0;
}
.clickable-metrics > button > span {
  font-size: 10px;
  color: #7a8d97;
}
.clickable-metrics button strong {
  font-size: 26px;
  font-weight: 550;
  display: flex;
  gap: 9px;
  align-items: baseline;
  margin-top: 7px;
  line-height: 1.1;
}
.voice-assistant {
  margin: 22px 0;
}
.voice-assistant .section-head h2 {
  margin-top: 9px;
  font-size: 24px;
}
.microphone-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 13px;
  min-height: 160px;
  width: 100%;
  background: #e6f0e8;
  border: 1px solid #bcd4c1;
  border-radius: 10px;
  color: #376c61;
}
.microphone-button strong {
  font-size: 21px;
}
.microphone-button span {
  font-size: 11px;
  color: #719087;
}
.microphone-button.recording {
  background: #f3e7df;
  border-color: #d4b6a2;
  color: #a76d59;
}
.voice-assistant textarea {
  min-height: 110px;
  font-size: 15px;
  margin-bottom: 13px;
}
.voice-proposal {
  border: 1px solid #d5e3d4;
  border-radius: 8px;
  padding: 23px;
  background: #f0f6eb;
  margin-top: 22px;
}
.voice-proposal h3 {
  margin-bottom: 12px;
}
.voice-proposal > p {
  font-size: 12px;
}
.proposed-action {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px 0;
  border-bottom: 1px solid #dce7d7;
  font-size: 14px;
}
.proposed-action svg {
  color: #76a68a;
  flex-shrink: 0;
}
.voice-confirm {
  display: flex;
  gap: 14px;
  justify-content: space-between;
  margin-top: 18px;
}
.voice-confirm .primary {
  font-size: 15px;
  padding: 17px;
}
.workshop-job {
  border: 1px solid #dce7db;
  padding: 18px 21px;
  background: #fcfdf8;
  border-radius: 8px;
  margin-bottom: 20px;
}
.workshop-job > strong {
  font-size: 11px;
  color: #88a290;
}
.workshop-job > p {
  margin: 8px 0;
  font-size: 15px;
  color: #3e5964;
}
.workshop-job > span {
  font-size: 11px;
  color: #8b9e92;
}
.pause-choices {
  margin-top: 20px;
}
.pause-choices button {
  margin: 18px 12px 0 0;
  min-height: 55px;
  font-size: 14px;
}
.manager-requests {
  margin-bottom: 23px;
}
.manager-request {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid #dbe5d7;
  flex-wrap: wrap;
}
.manager-request > svg {
  color: #83a398;
  flex-shrink: 0;
}
.manager-request > div {
  flex: 1;
  min-width: 230px;
}
.manager-request h4 {
  font-size: 13px;
  margin: 0 0 7px;
}
.manager-request p {
  font-size: 11px;
  margin-bottom: 7px;
}
.manager-request small {
  font-size: 9px;
}
.manager-request .check-label {
  font-size: 11px !important;
  margin: 10px 0;
}
.manager-request > span {
  font-size: 11px;
  color: #ac9068;
}
.manager-request.issue > svg {
  color: #b2996f;
}
.manager-request input:not([type="checkbox"]) {
  margin-top: 10px;
  font-size: 12px;
}
.intelligence-v2 {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 24px;
  align-items: start;
}
.intelligence-v2 .diagnostic {
  padding: 27px;
}
.intelligence-v2 select,
.intelligence-v2 input {
  font-size: 12px;
}
.diagnostic-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
}
.diagnostic-upload {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  border: 1px solid #d3e0d3;
  border-radius: 6px;
  font-size: 11px;
  color: #627f79;
  cursor: pointer;
  margin: 0;
}
.diagnostic-upload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.report-source {
  font-size: 10px;
  white-space: pre-wrap;
  line-height: 1.7;
  max-height: 220px;
  overflow: auto;
  padding: 15px;
  background: #eef3e9;
  border-radius: 6px;
}
.intelligence-v2 details {
  font-size: 11px;
  margin-top: 20px;
  color: #81998c;
}
.case-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.case-comparison li {
  font-size: 10px;
}
.diagnostic-test {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 12px 0;
  border-bottom: 1px solid #e2e9de;
  color: #799b89;
}
.diagnostic-test svg {
  flex-shrink: 0;
}
.diagnostic-test strong {
  font-size: 11px;
}
.diagnostic-test small {
  display: block;
  font-size: 10px;
  line-height: 1.7;
  margin-top: 7px;
  color: #8a9c96;
}
.diagnostic-test.missing {
  color: #b0966c;
}
.case-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}
.diagnostic-voice {
  grid-column: 1/-1;
}
.intelligence-v2 .notice {
  margin: 20px 0;
  font-size: 10px;
}
.intelligence-v2 .case-card > h3 {
  font-size: 17px;
  line-height: 1.5;
}
.stock-unit {
  font-size: 9px;
  margin-left: 4px;
  color: #8fa194;
}
@media (max-width: 1000px) {
  .intelligence-v2 {
    grid-template-columns: 1fr;
  }
  .intelligence-v2 .diagnostic {
    position: static;
  }
  .clickable-metrics > button {
    padding: 0 18px;
  }
  .microphone-button span {
    font-size: 10px;
  }
}
@media (max-width: 760px) {
  .voice-confirm {
    flex-direction: column;
  }
  .voice-confirm .primary {
    width: 100%;
  }
  .microphone-button strong {
    font-size: 18px;
  }
  .microphone-button span {
    padding: 0 15px;
    text-align: center;
    line-height: 1.6;
  }
  .case-comparison {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  .clickable-metrics > button:nth-child(2) {
    border-right: 0;
  }
  .manager-request > button {
    width: 100%;
  }
}
.model-honesty {
  display: block;
  font-size: 9px;
  color: #9b8b69;
  background: #f3efe3;
  border: 1px solid #e9dfc9;
  border-radius: 4px;
  padding: 7px 9px;
  line-height: 1.5;
  margin-bottom: 16px;
}

.badge.red {
  color: #a52f3b;
  background: #ffe5e8;
}
.badge.amber {
  color: #925700;
  background: #fff0ce;
}
.badge.green {
  color: #137447;
  background: #ddf7e8;
}

.delivery-deadline {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 9px;
  background: #edf3f8;
  color: #305e7a;
  margin: 8px 0;
}
.delivery-deadline small {
  font-size: 11px;
  color: inherit;
}
.delivery-deadline.late {
  background: #ffe3e8;
  color: #ab263b;
  border-left: 3px solid #d34458;
}
.delivery-deadline.soon {
  background: #fff0cf;
  color: #976000;
  border-left: 3px solid #e4aa27;
}
.delivery-deadline.ready {
  background: #ddf6e8;
  color: #187548;
}

.brand-targets {
  margin: 16px 0;
}
.brand-targets summary {
  cursor: pointer;
  font-weight: 600;
}
.brand-target-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}
.brand-target-grid a {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  background: #edf4f9;
  color: #305c77;
  border-radius: 8px;
  text-decoration: none;
}
.brand-target-grid small {
  font-size: 11px;
}

.vehicle-view-controls {
  position: absolute;
  right: 18px;
  top: 18px;
  display: flex;
  gap: 5px;
  padding: 5px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 3px 14px #17344b15;
  z-index: 3;
}
.vehicle-view-controls button {
  border: 0;
  background: #edf4f9;
  color: #315e7c;
  border-radius: 7px;
  padding: 9px 10px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.vehicle-view-controls button:hover {
  background: #d8eafa;
}
@media (max-width: 650px) {
  .vehicle-view-controls {
    top: auto;
    bottom: 22px;
    right: 10px;
  }
}

.guided-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.guided-toolbar button {
  min-height: 44px;
}
.guided-context {
  padding: 24px;
  overflow: auto;
  max-height: 620px;
}
.guided-context h2 {
  font-size: 23px;
  margin: 0 0 12px;
}
.guided-item {
  padding: 14px;
  margin: 12px 0;
  border-radius: 12px;
  background: #edf4f8;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.guided-item small {
  color: #5e737e;
}
.guided-context .vehicle-row {
  width: 100%;
  min-height: 66px;
}
.glove-mode button,
.glove-mode select {
  min-height: 64px !important;
  min-width: 64px !important;
  font-size: 17px !important;
  touch-action: manipulation;
}
.glove-mode .guided-toolbar button {
  padding: 16px 22px;
}
.glove-mode .mini-map,
.glove-mode .vehicle-view-controls {
  display: none;
}
.glove-mode .zone-menu {
  max-width: 260px;
}
.glove-mode .panel-tabs {
  gap: 8px;
}
.glove-mode .context-panel .vehicle-facts,
.glove-mode .context-panel textarea,
.glove-mode .context-panel label[for="notes"] {
  display: none;
}
.glove-mode .context-panel .vehicle-row {
  min-height: 84px;
}
.glove-mode .context-panel button {
  margin-top: 8px;
}
@media (max-width: 1050px) {
  .guided-toolbar {
    justify-content: flex-end;
  }
  .scene-toolbar {
    align-items: flex-start;
  }
}

.guided-zones {
  display: flex;
  gap: 8px;
  padding: 12px 18px;
  overflow-x: auto;
  border-top: 1px solid #e2e9ec;
  background: #f6f9fb;
}
.guided-zones button {
  border: 1px solid #d9e5ec;
  border-radius: 9px;
  min-width: 86px;
  min-height: 46px;
  padding: 9px 13px;
  background: white;
  color: #335c75;
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.guided-zones button.active {
  background: #315f7c;
  color: white;
  border-color: #315f7c;
}
.guided-zone-menu {
  display: none;
}
.glove-mode .guided-zones button {
  min-width: 112px !important;
  min-height: 74px !important;
}

.client-progress {
  list-style: none;
  margin: 12px 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.client-progress li {
  font-size: 11px;
  padding: 6px 8px;
  background: #eef2f4;
  border-radius: 6px;
  color: #657a87;
}
.client-progress li[aria-current="step"] {
  color: white;
  background: #315f7c;
  font-weight: 600;
}
.glove-mode .client-progress li {
  font-size: 13px;
  padding: 9px;
}

.glove-mode .guided-zones {
  flex-wrap: wrap;
  overflow: visible;
}
.glove-mode .page-heading {
  display: none;
}
.glove-mode .metrics {
  display: none;
}
.glove-mode .garage-layout {
  margin-top: 0;
}

.scene-toolbar {
  height: auto;
  min-height: 57px;
  padding: 10px 16px;
  flex-wrap: wrap;
}
.glove-mode .scene-title {
  display: none;
}
.glove-mode .guided-toolbar {
  width: 100%;
  justify-content: space-between;
}
.glove-mode .garage-layout {
  min-height: 0;
}
.glove-mode .scene-viewport {
  flex: none;
  min-height: 330px;
  height: calc(100dvh - 350px);
}
body:has(.glove-mode) .sidebar {
  width: 72px;
  padding: 12px 8px;
}
body:has(.glove-mode) .sidebar .brand {
  font-size: 0;
  justify-content: center;
}
body:has(.glove-mode) .sidebar .brand svg {
  width: 28px;
}
body:has(.glove-mode) .sidebar .garage-brand,
body:has(.glove-mode) .sidebar .sidebar-label,
body:has(.glove-mode) .sidebar .user,
body:has(.glove-mode) .sidebar .nav-item .badge {
  display: none;
}
body:has(.glove-mode) .sidebar .nav-item {
  font-size: 0;
  justify-content: center;
  min-height: 48px;
  padding: 12px;
}
body:has(.glove-mode) .sidebar .nav-item svg {
  flex-shrink: 0;
}
.workspace:has(.glove-mode) {
  margin-left: 72px;
  width: calc(100% - 72px);
}

body:has(.glove-mode) .sidebar .garage-name,
body:has(.glove-mode) .sidebar .nav-caption,
body:has(.glove-mode) .sidebar .local-card,
body:has(.glove-mode) .sidebar .nav-count,
body:has(.glove-mode) .sidebar .brand > span:last-child {
  display: none;
}

/* The garage itself is the working surface; contextual dashboards float inside it. */
.spatial-workspace {
  padding: 14px !important;
}
.spatial-workspace > .page-heading,
.spatial-workspace > .metrics {
  display: none;
}
.spatial-workspace .garage-layout {
  display: block;
  position: relative;
  height: calc(100dvh - 105px);
  min-height: 540px;
}
.spatial-workspace .scene-card {
  height: 100%;
  border-radius: 16px;
}
.spatial-workspace .scene-viewport {
  flex: 1;
  height: auto !important;
  min-height: 0;
}
.spatial-workspace .context-panel {
  display: none;
}
.spatial-workspace .has-context .context-panel {
  display: block;
  position: absolute;
  z-index: 5;
  right: 18px;
  top: 138px;
  bottom: 52px;
  width: min(340px, 36%);
  min-height: 0;
  background: #fbfdfb;
  border: 1px solid #cad6d3;
  border-radius: 14px;
  box-shadow: 0 16px 44px #243e4926;
  overflow-y: auto;
  animation: context-arrival 0.22s ease-out;
}
.spatial-workspace .minimap {
  transform: scale(0.72);
  transform-origin: bottom left;
}
.spatial-workspace .canvas-host canvas {
  touch-action: none;
}
@keyframes context-arrival {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spatial-workspace .context-panel {
    animation: none !important;
  }
}
@media (max-width: 760px) {
  .spatial-workspace .has-context .context-panel {
    top: auto;
    bottom: 45px;
    right: 10px;
    left: 10px;
    width: auto;
    max-height: 42%;
  }
}
.spatial-stats {
  display: grid;
  gap: 8px;
  padding: 18px;
  margin-bottom: 20px;
  border-radius: 10px;
  background: #e5eef2;
  color: #294e61;
}
.spatial-stats strong {
  font-size: 22px;
}

````

## src/team-data.ts

````typescript
export const departments = [
  "Mécanique",
  "Diagnostic",
  "Pneumatiques",
  "Vitrage",
  "Carrosserie",
  "Peinture",
  "Contrôle qualité",
  "Livraison",
] as const;
export type Department = (typeof departments)[number];
export type Technician = {
  id: string;
  name: string;
  specialty: string;
  skills: Department[];
  department: Department;
  color: string;
  shiftStart: string;
  shiftEnd: string;
  quality: { checked: number; reworks: number };
};
export const team: Technician[] = [
  {
    id: "kader",
    name: "Kader",
    specialty: "Vitrage et pare-brise",
    skills: ["Vitrage", "Contrôle qualité"],
    department: "Vitrage",
    color: "#4f7f8b",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 38, reworks: 1 },
  },
  {
    id: "yanis",
    name: "Yanis",
    specialty: "Mécanique générale et freinage",
    skills: ["Mécanique", "Contrôle qualité"],
    department: "Mécanique",
    color: "#657c8c",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 42, reworks: 1 },
  },
  {
    id: "sofiane",
    name: "Sofiane",
    specialty: "Carrosserie et peinture",
    skills: ["Carrosserie", "Peinture", "Contrôle qualité"],
    department: "Carrosserie",
    color: "#987863",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 31, reworks: 0 },
  },
  {
    id: "mehdi",
    name: "Mehdi",
    specialty: "Pneumatiques et géométrie",
    skills: ["Pneumatiques", "Contrôle qualité"],
    department: "Pneumatiques",
    color: "#63816e",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 47, reworks: 1 },
  },
  {
    id: "thomas",
    name: "Thomas",
    specialty: "Diagnostic électronique",
    skills: ["Diagnostic", "Contrôle qualité"],
    department: "Diagnostic",
    color: "#50758d",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 34, reworks: 0 },
  },
  {
    id: "karim",
    name: "Karim",
    specialty: "Entretien et révisions",
    skills: ["Mécanique", "Contrôle qualité"],
    department: "Mécanique",
    color: "#9a8560",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 51, reworks: 1 },
  },
  {
    id: "lucas",
    name: "Lucas",
    specialty: "Mécanique lourde et suspension",
    skills: ["Mécanique", "Contrôle qualité"],
    department: "Mécanique",
    color: "#627786",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 29, reworks: 0 },
  },
  {
    id: "rayan",
    name: "Rayan",
    specialty: "Mécanique polyvalente",
    skills: ["Mécanique", "Diagnostic", "Pneumatiques", "Contrôle qualité"],
    department: "Mécanique",
    color: "#738b80",
    shiftStart: "08:00",
    shiftEnd: "18:00",
    quality: { checked: 44, reworks: 1 },
  },
];
export const resources = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: "lift-" + (i + 1),
    name: "Pont " + (i + 1),
    department: "Mécanique" as Department,
    bay: i + 1,
  })),
  {
    id: "tyres",
    name: "Poste pneumatiques",
    department: "Pneumatiques" as Department,
    bay: null,
  },
  {
    id: "glass",
    name: "Poste vitrage",
    department: "Vitrage" as Department,
    bay: null,
  },
  {
    id: "diagnostic",
    name: "Poste diagnostic",
    department: "Diagnostic" as Department,
    bay: null,
  },
  {
    id: "body",
    name: "Zone carrosserie",
    department: "Carrosserie" as Department,
    bay: null,
  },
  {
    id: "paint",
    name: "Cabine peinture",
    department: "Peinture" as Department,
    bay: null,
  },
  {
    id: "quality",
    name: "Contrôle final",
    department: "Contrôle qualité" as Department,
    bay: null,
  },
];

````

## src/voice-domain.ts

````typescript
import { type DB } from "./domain.ts";
import {
  reportIssue,
  pauseWork,
  requestPart,
  addAlert,
  patchWorkshop,
  workshopFor,
  toggleWork,
  finishWork,
  elapsedSeconds,
} from "./workshop-domain.ts";
export type VoiceAction = {
  type: "pause" | "resume" | "piece" | "issue" | "note" | "alert" | "finish";
  label: string;
  part?: string;
  quantity?: number;
  text?: string;
};
export type VoiceProposal = {
  vehicle: string;
  text: string;
  actions: VoiceAction[];
  warnings: string[];
  reply: string;
  conflict: boolean;
};
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
export function proposeVoice(
  db: DB,
  id: string,
  text: string,
  mode = "command",
  now = Date.now(),
): VoiceProposal {
  const v = db.vehicles.find((v) => v.id === id);
  if (!v) throw Error("Ouvrez un dossier.");
  const t = normalize(text);
  const actions: VoiceAction[] = [],
    warnings: string[] = [];
  const mentioned = db.vehicles.filter(
    (c) =>
      c.id !== id &&
      c.present !== false &&
      [c.make, c.model].some(
        (word) =>
          word.length >= 4 &&
          new RegExp(
            "\\b" +
              normalize(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
              "\\b",
          ).test(t),
      ),
  );
  const currentMention = [v.make, v.model].some((word) =>
    t.includes(normalize(word)),
  );
  if (mentioned.length && !currentMention)
    return {
      vehicle: id,
      text,
      actions: [],
      warnings: [
        "Le véhicule cité ne correspond pas au dossier ouvert. Sélectionnez le bon véhicule.",
      ],
      reply: "Véhicule à confirmer.",
      conflict: true,
    };
  if (
    mode === "command" &&
    /(?:ne|n['’]).{0,16}(?:mets?|mettez|demarr|termin|confirm|repren).{0,15}pas/.test(
      t,
    )
  )
    return {
      vehicle: id,
      text,
      actions: [],
      warnings: [
        "Négation détectée : reformulez une commande courte pour éviter une action erronée.",
      ],
      reply: "Aucune action proposée.",
      conflict: true,
    };
  if (/combien.*temps|temps.*reste/.test(t)) {
    const remaining = Math.max(
      0,
      (v.estimatedMinutes || 0) * 60 - elapsedSeconds(workshopFor(db, id), now),
    );
    return {
      vehicle: id,
      text,
      actions: [],
      warnings: [],
      reply:
        Math.ceil(remaining / 60) +
        " minutes sur l’estimation saisie ; ce n’est pas une garantie de fin.",
      conflict: false,
    };
  }
  if (/intervention.{0,15}(?:empose|en pose)/.test(t))
    warnings.push(
      "Formulation audio incertaine interprétée comme une pause : vérifiez le résumé avant confirmation.",
    );
  const partMappings: [RegExp, string][] = [
    [/etrie?r.*(droit|droite)/, "caliper-right"],
    [/etrie?r/, "caliper"],
    [/disqu.*arriere/, "disc-rear"],
    [/disqu/, "disc"],
    [/plaquett.*arriere/, "pads-rear"],
    [/plaquett/, "pads"],
    [/filtre.*huile/, "filter"],
    [/filtre.*air/, "air-filter"],
    [/pare.?brise/, "windscreen"],
    [/batterie/, "battery"],
    [/pneu/, "tyre-16"],
  ];
  const match = partMappings.find(([re]) => re.test(t));
  if (/pause|arrete|intervention.{0,15}(?:empose|en pose)/.test(t))
    actions.push({
      type: "pause",
      label: "Mettre l’intervention en pause",
      text: /manqu|piece|filtre|etrie?r/.test(t)
        ? "Attente de pièce"
        : "Pause demandée vocalement",
    });
  if (/repren|recommenc|demarr/.test(t))
    actions.push({
      type: "resume",
      label: "Démarrer / reprendre l’intervention",
    });
  if (
    (mode === "piece" ||
      /il.*(manqu|faut)|demande.*(piece|disqu|filtre|etrie?r|plaquett)|besoin/.test(
        t,
      )) &&
    match
  ) {
    const q = t.match(/\b(\d+|deux|trois|quatre|une|un)\b/);
    const numbers: Record<string, number> = {
      deux: 2,
      trois: 3,
      quatre: 4,
      un: 1,
      une: 1,
    };
    const quantity = q ? numbers[q[1]] || Number(q[1]) : 1;
    const part = db.parts.find((p) => p.id === match[1])!;
    actions.push({
      type: "piece",
      label: `Demander ${quantity} × ${part.name}`,
      part: part.id,
      quantity,
    });
    warnings.push(
      `Référence interne ${part.ref}, illustration générique : compatibilité à vérifier par le responsable. ${part.stock - part.reserved} en stock disponible.`,
    );
  } else if (mode === "piece")
    warnings.push(
      "Pièce non reconnue. Utilisez la sélection manuelle du stock ; aucune référence OEM n’est inventée.",
    );
  if (
    mode === "issue" ||
    /signale|fuite|cassee|casse |usees|usee |diagnostic.*complementaire/.test(t)
  )
    actions.push({
      type: "issue",
      label: "Signaler un problème, bloquer et alerter le responsable",
      text,
    });
  else if (mode === "report" || /ajoute.*note|compte.?rendu/.test(t))
    actions.push({
      type: "note",
      label: "Ajouter un compte rendu au dossier",
      text: text.replace(/^.*?note\s*:\s*/i, ""),
    });
  if (
    /previen[st]|avertis|alerte.*(chef|responsable)/.test(t) &&
    !actions.some((a) => a.type === "issue")
  )
    actions.push({
      type: "alert",
      label: "Alerter le chef d’atelier dans l’application",
      text,
    });
  if (/terminee|termine|controle qualite/.test(t))
    actions.push({
      type: "finish",
      label: "Terminer les travaux et demander le contrôle qualité",
    });
  if (!actions.length && !warnings.length)
    warnings.push("Commande non comprise. Aucune action ne sera exécutée.");
  return {
    vehicle: id,
    text,
    actions,
    warnings,
    reply: actions.map((a) => a.label).join(". "),
    conflict: false,
  };
}
export function applyVoice(
  db: DB,
  id: string,
  text: string,
  mode: string,
  confirmed: boolean,
  now = Date.now(),
): DB {
  if (!confirmed) throw Error("Confirmez explicitement les actions proposées.");
  const p = proposeVoice(db, id, text, mode, now);
  if (p.conflict || !p.actions.length)
    throw Error("Aucune action confirmable.");
  let next = db;
  for (const a of p.actions) {
    if (a.type === "pause")
      next = pauseWork(
        next,
        id,
        a.text || "Pause vocale",
        p.actions.some((x) => x.type === "piece"),
        now,
      );
    if (a.type === "resume" && !workshopFor(next, id).runningSince)
      next = toggleWork(next, id, now);
    if (a.type === "issue")
      next = reportIssue(next, id, a.text!, "Incident mécanique", now);
    if (a.type === "piece")
      next = requestPart(next, id, a.part!, a.quantity, now);
    if (a.type === "alert")
      next = addAlert(next, id, "responsable", a.text!, now);
    if (a.type === "note") {
      const s = workshopFor(next, id);
      next = patchWorkshop(
        next,
        id,
        {
          reports: [
            ...s.reports,
            {
              id: crypto.randomUUID(),
              text: a.text!,
              at: new Date(now).toISOString(),
            },
          ],
        },
        "Compte rendu vocal confirmé",
      );
    }
    if (a.type === "finish") next = finishWork(next, id, now);
  }
  return next;
}

````

## src/workshop-domain.ts

````typescript
import {
  record,
  updateVehicle,
  reservePart,
  type DB,
  type Vehicle,
} from "./domain.ts";
export type WorkshopPhoto = { id: string; data: string; at: string };
export type WorkshopState = {
  elapsed: number;
  runningSince: string | null;
  checks: { repair: boolean; safety: boolean; test: boolean };
  keyLocation: string;
  issues: {
    id: string;
    text: string;
    at: string;
    state?: string;
    category?: string;
  }[];
  photos: WorkshopPhoto[];
  reports: { id: string; text: string; at: string }[];
  requests: {
    id: string;
    part: string;
    at: string;
    state: string;
    quantity?: number;
  }[];
  idleElapsed?: number;
  pausedSince?: string | null;
  pauseReason?: string;
  blocked?: boolean;
  events?: { type: string; at: string; reason: string }[];
};
export const emptyWorkshop = (): WorkshopState => ({
  elapsed: 0,
  runningSince: null,
  checks: { repair: false, safety: false, test: false },
  keyLocation: "Accueil · casier à préciser",
  issues: [],
  photos: [],
  reports: [],
  requests: [],
  idleElapsed: 0,
  pausedSince: null,
  pauseReason: "",
  blocked: false,
  events: [],
});
export function workshopFor(db: DB, id: string): WorkshopState {
  return db.workshop && Object.hasOwn(db.workshop, id)
    ? { ...emptyWorkshop(), ...db.workshop[id] }
    : emptyWorkshop();
}
export function patchWorkshop(
  db: DB,
  id: string,
  patch: Partial<WorkshopState>,
  action: string,
): DB {
  if (!db.vehicles.some((v) => v.id === id))
    throw Error("Dossier introuvable.");
  return record(
    {
      ...db,
      workshop: { ...db.workshop, [id]: { ...workshopFor(db, id), ...patch } },
    },
    id,
    action,
  );
}
export function elapsedSeconds(state: WorkshopState, now = Date.now()) {
  return (
    state.elapsed +
    (state.runningSince
      ? Math.max(
          0,
          Math.floor((now - new Date(state.runningSince).getTime()) / 1000),
        )
      : 0)
  );
}
export function toggleWork(db: DB, id: string, now = Date.now()): DB {
  const v = db.vehicles.find((v) => v.id === id);
  if (!v) throw Error("Dossier introuvable.");
  const s = workshopFor(db, id);
  if (s.runningSince)
    return patchWorkshop(
      db,
      id,
      {
        elapsed: elapsedSeconds(s, now),
        runningSince: null,
        pausedSince: new Date(now).toISOString(),
        pauseReason: "Pause manuelle",
        events: [
          ...(s.events || []),
          {
            type: "pause",
            at: new Date(now).toISOString(),
            reason: "Pause manuelle",
          },
        ],
      },
      "Intervention mise en pause",
    );
  if (
    ["Devis à valider", "Prêt à livrer", "Livré", "Contrôle qualité"].includes(
      v.status,
    )
  )
    throw Error(
      "Ce statut ne permet pas de démarrer : vérifiez le devis ou le contrôle final.",
    );
  if (v.technician === "Non affecté")
    throw Error("Affectez un technicien avant de démarrer.");
  if (
    s.issues.some((i) => i.state !== "Résolu") ||
    s.requests.some((r) => !r.state.startsWith("Réservée"))
  )
    throw Error(
      "Le responsable doit traiter le blocage ou valider les pièces avant reprise.",
    );
  if (
    db.vehicles.some(
      (other) =>
        other.id !== id &&
        other.technician === v.technician &&
        workshopFor(db, other.id).runningSince,
    )
  )
    throw Error(
      "Ce technicien a déjà une intervention active. Mettez-la en pause ou réaffectez le dossier.",
    );
  const appointment = db.appointments?.find(
    (a) => a.vehicle === id && a.state !== "Terminé",
  );
  let next = updateVehicle(db, id, {
    status: "En intervention",
    present: true,
  });
  if (appointment)
    next = {
      ...next,
      appointments: next.appointments!.map((a) =>
        a.id === appointment.id
          ? { ...a, state: "En cours" as const, arrived: true }
          : a,
      ),
    };
  return patchWorkshop(
    next,
    id,
    {
      runningSince: new Date(now).toISOString(),
      idleElapsed:
        (s.idleElapsed || 0) +
        (s.pausedSince
          ? Math.max(0, Math.floor((now - Date.parse(s.pausedSince)) / 1000))
          : 0),
      pausedSince: null,
      pauseReason: "",
      blocked: false,
      events: [
        ...(s.events || []),
        {
          type: s.events?.length ? "resume" : "start",
          at: new Date(now).toISOString(),
          reason: "",
        },
      ],
    },
    "Intervention démarrée",
  );
}
export function finishWork(db: DB, id: string, now = Date.now()) {
  const v = db.vehicles.find((v) => v.id === id);
  if (!v || v.status !== "En intervention")
    throw Error("Démarrez d’abord l’intervention.");
  const s = workshopFor(db, id);
  if (!Object.values(s.checks).every(Boolean))
    throw Error("Complétez les trois points de contrôle avant de terminer.");
  const next = patchWorkshop(
    db,
    id,
    { elapsed: elapsedSeconds(s, now), runningSince: null },
    "Travaux terminés, contrôle final demandé",
  );
  const finished = updateVehicle(next, id, {
    status: "Contrôle qualité",
    quality: false,
    bay: null,
  });
  return {
    ...finished,
    appointments: finished.appointments?.map((a) =>
      a.vehicle === id ? { ...a, state: "Terminé" as const } : a,
    ),
  };
}
export function requestPart(
  db: DB,
  id: string,
  part: string,
  quantity = 1,
  now = Date.now(),
): DB {
  const p = db.parts.find((p) => p.id === part);
  if (!p) throw Error("Pièce introuvable.");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20)
    throw Error("Quantité invalide.");
  const s = workshopFor(db, id);
  if (s.requests.some((r) => r.part === part && r.state !== "Annulée"))
    throw Error("Une demande existe déjà pour cette pièce.");
  const at = new Date(now).toISOString();
  const next = patchWorkshop(
    db,
    id,
    {
      requests: [
        ...s.requests,
        {
          id: crypto.randomUUID(),
          part,
          quantity,
          at,
          state: "À valider responsable",
        },
      ],
    },
    "Demande de pièce : " + p.name + " × " + quantity,
  );
  const blocked =
    p.stock - p.reserved < quantity
      ? pauseWork(next, id, "Attente de pièce", true, now)
      : next;
  return addAlert(
    blocked,
    id,
    "piece",
    `${quantity} × ${p.name} demandé · ${p.stock - p.reserved} disponible(s) · compatibilité à vérifier.`,
    now,
  );
}
export function addAlert(
  db: DB,
  vehicle: string,
  kind: string,
  message: string,
  now = Date.now(),
): DB {
  return {
    ...db,
    alerts: [
      {
        id: crypto.randomUUID(),
        vehicle,
        kind,
        message,
        at: new Date(now).toISOString(),
        resolved: false,
      },
      ...(db.alerts || []),
    ],
  };
}
export function pauseWork(
  db: DB,
  id: string,
  reason: string,
  blocked = false,
  now = Date.now(),
): DB {
  const s = workshopFor(db, id);
  const at = new Date(now).toISOString();
  const next = patchWorkshop(
    db,
    id,
    {
      elapsed: elapsedSeconds(s, now),
      runningSince: null,
      pausedSince: s.pausedSince || at,
      pauseReason: reason,
      blocked: blocked || s.blocked,
      events: [...(s.events || []), { type: "pause", at, reason }],
    },
    "Pause : " + reason,
  );
  return {
    ...next,
    appointments: next.appointments?.map((a) =>
      a.vehicle === id && a.state !== "Terminé"
        ? { ...a, state: "En pause" as const }
        : a,
    ),
  };
}
export function reportIssue(
  db: DB,
  id: string,
  text: string,
  category = "Incident mécanique",
  now = Date.now(),
): DB {
  if (!text.trim()) throw Error("Décrivez le problème.");
  const s = workshopFor(db, id),
    at = new Date(now).toISOString();
  let next = patchWorkshop(
    db,
    id,
    {
      issues: [
        ...s.issues,
        { id: crypto.randomUUID(), text, at, state: "Ouvert", category },
      ],
      blocked: true,
    },
    "Problème signalé : " + text,
  );
  next = pauseWork(next, id, category, true, now);
  return addAlert(next, id, "incident", text, now);
}
export function approveRequest(
  db: DB,
  id: string,
  requestId: string,
  compatibilityConfirmed: boolean,
  now = Date.now(),
): DB {
  if (!compatibilityConfirmed)
    throw Error("Confirmez la référence et la compatibilité avant validation.");
  const s = workshopFor(db, id),
    r = s.requests.find((r) => r.id === requestId);
  if (!r || r.state.startsWith("Réservée"))
    throw Error("Demande inexistante ou déjà validée.");
  const p = db.parts.find((p) => p.id === r.part)!,
    v = db.vehicles.find((v) => v.id === id)!,
    quantity = r.quantity || 1;
  if (p.stock - p.reserved < quantity)
    throw Error(
      "Stock insuffisant. Préparez une commande à valider ou simulez une réception.",
    );
  const held = v.partReservations?.[p.id] || (v.parts.includes(p.id) ? 1 : 0);
  const next = {
    ...db,
    parts: db.parts.map((x) =>
      x.id === p.id
        ? {
            ...x,
            reserved: x.reserved + quantity,
            lastMovement: new Date(now).toISOString(),
          }
        : x,
    ),
    vehicles: db.vehicles.map((x) =>
      x.id === id
        ? {
            ...x,
            parts: [...new Set([...x.parts, p.id])],
            partReservations: {
              ...x.partReservations,
              [p.id]: held + quantity,
            },
          }
        : x,
    ),
    stockMovements: [
      {
        id: crypto.randomUUID(),
        part: p.id,
        vehicle: id,
        kind: "Réservation",
        quantity,
        at: new Date(now).toISOString(),
      },
      ...(db.stockMovements || []),
    ],
  };
  const updated = patchWorkshop(
    next,
    id,
    {
      requests: s.requests.map((x) =>
        x.id === r.id
          ? { ...x, state: "Réservée · référence validée manuellement" }
          : x,
      ),
    },
    "Demande de pièce validée et réservée par le responsable",
  );
  return {
    ...updated,
    alerts: updated.alerts?.map((a) =>
      a.vehicle === id && a.kind === "piece" ? { ...a, resolved: true } : a,
    ),
  };
}
export function resolveIssue(
  db: DB,
  id: string,
  issueId: string,
  decision: string,
  now = Date.now(),
): DB {
  if (!decision.trim()) throw Error("Consignez la décision.");
  const s = workshopFor(db, id);
  if (!s.issues.some((i) => i.id === issueId))
    throw Error("Incident introuvable.");
  const issues = s.issues.map((i) =>
    i.id === issueId ? { ...i, state: "Résolu" } : i,
  );
  const next = patchWorkshop(
    db,
    id,
    {
      issues,
      blocked:
        issues.some((i) => i.state !== "Résolu") ||
        s.requests.some((r) => !r.state.startsWith("Réservée")),
    },
    "Décision responsable : " + decision,
  );
  return {
    ...next,
    alerts: next.alerts?.map((a) =>
      a.vehicle === id && a.kind === "incident" ? { ...a, resolved: true } : a,
    ),
  };
}
export function duplicateVehicle(db: DB, v: Vehicle) {
  const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return db.vehicles.find(
    (c) =>
      c.id !== v.id &&
      ((v.vin && c.vin && normalize(v.vin) === normalize(c.vin)) ||
        ((c.country || "FR") === (v.country || "FR") &&
          normalize(c.plate) === normalize(v.plate))),
  );
}

````

## tests/camera.test.ts

````typescript
import { occludesTarget } from "../src/camera-occlusion.ts";
import * as THREE from "three";
import { nearestWalkable, blocked, findPath } from "../src/navigation.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  zoneView,
  vehicleView,
  isRendered,
  shortestTurn,
} from "../src/camera-navigation.ts";
import { seed, vehiclePosition } from "../src/domain.ts";
import { portoLayout } from "../src/dealership-layout.ts";

test("all workshop cars are framed from the central aisle, including both rows", () => {
  const db = seed();
  for (const spacing of [5, 6, 7])
    for (const v of db.vehicles.filter(
      (v) => v.present !== false && v.status !== "Livré",
    )) {
      const [x, z] = vehiclePosition(v, db.vehicles, {
        ...portoLayout,
        workshopSpacing: spacing,
      });
      const view = vehicleView(x, z, 1.2);
      assert.equal(view.target[0], x);
      assert.equal(view.target[2], z);
      if (z < 0) assert.ok(Math.abs(view.position[0]) < Math.abs(x), v.plate);
      if (z > 6) assert.ok(view.position[2] < 18, v.plate);
      assert.ok(view.position[1] > 3);
    }
});
test("narrow screens increase the distance to fit the complete car", () => {
  assert.ok(
    Math.abs(vehicleView(-7, -12, 0.5).position[0] + 7) >
      Math.abs(vehicleView(-7, -12, 1.4).position[0] + 7),
  );
});
test("hidden walls and hidden procedural wheels cannot consume the click", () => {
  const parent = { visible: false, parent: null };
  assert.equal(isRendered({ visible: true, parent }), false);
  assert.equal(isRendered({ visible: false, parent: null }), false);
  assert.equal(
    isRendered({ visible: true, parent: { visible: true, parent: null } }),
    true,
  );
});
test("automatic navigation crosses the angle boundary without a complete spin", () => {
  const turn = shortestTurn(Math.PI - 0.01, -Math.PI + 0.01, 1 / 60);
  assert.ok(turn > Math.PI - 0.01);
  assert.ok(turn < Math.PI + 0.01);
});

test("walking destinations avoid the actual vehicle occupying a viewpoint", () => {
  const boxes = [{ x: -7, z: -27, w: 2.05, d: 4.5 }];
  const target = nearestWalkable([-7, -28], boxes);
  assert.ok(target);
  assert.equal(blocked(...target, boxes, 0.45), false);
  assert.ok(findPath([0, -28], target, boxes).length);
});

test("the whole car fits in the camera after opening a dossier or resizing", () => {
  for (const aspect of [0.45, 0.7, 1, 1.8])
    for (const x of [-7, 7, 15, 19])
      for (const rear of [false, true]) {
        const view = vehicleView(x, -22, aspect, rear);
        const camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 200);
        camera.position.set(...view.position);
        camera.lookAt(new THREE.Vector3(...view.target));
        camera.updateMatrixWorld();
        for (const dx of [-1.05, 1.05])
          for (const y of [0, 2])
            for (const dz of [-2.25, 2.25]) {
              const point = new THREE.Vector3(x + dx, y, -22 + dz).project(
                camera,
              );
              assert.ok(
                Math.abs(point.x) < 1 && Math.abs(point.y) < 1,
                `aspect ${aspect}: ${point.x},${point.y}`,
              );
            }
      }
});

test("a foreground wall is hidden while walls behind the vehicle remain visible", () => {
  const camera = new THREE.Vector3(-13, 2.7, -16),
    aim = new THREE.Vector3(-7, 0.95, -22);
  const wall = new THREE.Box3(
    new THREE.Vector3(-12.2, 0, -25),
    new THREE.Vector3(-11.8, 3, -10),
  );
  assert.equal(occludesTarget(wall, camera, aim), true);
  const safe = vehicleView(-7, -22, 1.2);
  assert.equal(
    occludesTarget(wall, new THREE.Vector3(...safe.position), aim),
    false,
  );
  const behind = new THREE.Box3(
    new THREE.Vector3(-22, 0, -40),
    new THREE.Vector3(22, 3, -39),
  );
  assert.equal(
    occludesTarget(behind, new THREE.Vector3(...safe.position), aim),
    false,
  );
});
test("delivery viewpoints are distinct and still look at the same car", () => {
  const first = vehicleView(19, 15, 1.2),
    second = vehicleView(19, 15, 1.2, true);
  assert.notDeepEqual(first.position, second.position);
  assert.deepEqual(first.target, second.target);
});

test("guided workshop and showroom views fit their complete floor on tablet screens", () => {
  for (const aspect of [0.7, 1.2, 1.8])
    for (const depth of [52, 59, 66])
      for (const id of ["atelier", "showroom"]) {
        const view = zoneView(id, 0, 14, aspect, depth);
        const camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 300);
        camera.position.set(...view.position);
        camera.lookAt(new THREE.Vector3(...view.target));
        camera.updateMatrixWorld();
        for (const x of [-12, 12])
          for (const z of id === "atelier" ? [-depth, -9] : [9, 19]) {
            const point = new THREE.Vector3(x, 0, z).project(camera);
            assert.ok(
              Math.abs(point.x) < 1 && Math.abs(point.y) < 1,
              `${id} ${aspect} ${depth}: ${point.x},${point.y}`,
            );
          }
      }
});

````

## tests/communication.test.ts

````typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  updateVehicle,
  loadDB,
  bayPosition,
  vehiclePosition,
} from "../src/domain.ts";
import { prepareClientMessage } from "../src/communication-domain.ts";
import { saveQuote } from "../src/quote-domain.ts";

test("pickup draft follows quality validation, is idempotent, and has no send state", () => {
  const db = seed();
  assert.throws(() => prepareClientMessage(db, "v1", "pickup"), /qualité/);
  const next = updateVehicle(db, "v1", {
    quality: true,
    status: "Prêt à livrer",
  });
  assert.equal(next.messages.length, db.messages.length + 1);
  assert.equal(prepareClientMessage(next, "v1", "pickup"), next);
  assert.match(next.messages[0].text, /GH-482-LP/);
  assert.ok(!("sent" in next.messages[0]));
});
test("submitted quote prepares correct rounded TTC without approving customer consent", () => {
  const db = seed();
  const next = saveQuote(db, {
    id: "quote-outbox",
    vehicle: "v1",
    vat: 20,
    state: "À valider",
    at: new Date().toISOString(),
    lines: [
      { id: "line", label: "Remplacement freins", quantity: 1, unitPrice: 100 },
    ],
  });
  assert.match(next.messages[0].text, /120,00/);
  assert.match(next.messages[0].text, /confirmer votre accord/);
  assert.equal(
    next.quotes!.find((q) => q.id === "quote-outbox")!.state,
    "À valider",
  );
  assert.equal(next.vehicles[0].status, db.vehicles[0].status);
});

test("dealership layout survives serialization and rejects invalid workshop dimensions", () => {
  const db = seed();
  db.dealership = {
    leftBrand: "Citroën",
    rightBrand: "Renault",
    waitingRoom: false,
    workshopSpacing: 7,
  };
  assert.equal(loadDB(JSON.stringify(db)).dealership!.waitingRoom, false);
  assert.deepEqual(bayPosition(8, db.dealership), [7, -61]);
  const positions = db.vehicles
    .filter((v) => v.present !== false && v.status !== "Livré")
    .map((v) => vehiclePosition(v, db.vehicles, db.dealership));
  assert.equal(new Set(positions.map((p) => p.join(","))).size, 14);
  db.dealership.workshopSpacing = 100;
  assert.throws(() => loadDB(JSON.stringify(db)));
});

````

## tests/domain.test.ts

````typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  updateVehicle,
  reservePart,
  loadDB,
  similarCases,
  record,
  zones,
} from "../src/domain.ts";
import { walls, findPath, blocked } from "../src/navigation.ts";
test("quality gate prevents delivery before validation and releases the bay after completion", () => {
  const d = seed();
  assert.throws(
    () => updateVehicle(d, "v1", { status: "Prêt à livrer" }),
    /qualité/,
  );
  assert.throws(() => updateVehicle(d, "v1", { status: "Livré" }), /prêt/);
  const ready = updateVehicle(d, "v1", {
    quality: true,
    status: "Prêt à livrer",
  });
  assert.equal(ready.vehicles[0].bay, null);
  assert.equal(
    updateVehicle(ready, "v1", { status: "Livré" }).vehicles[0].status,
    "Livré",
  );
  assert.equal(ready.audit[0].vehicle, "v1");
});
test("bay occupancy is enforced and unsuccessful assignment does not alter the original", () => {
  const d = seed();
  assert.throws(() => updateVehicle(d, "v1", { bay: 2 }), /occupé/);
  assert.equal(d.vehicles[0].bay, 1);
  assert.equal(updateVehicle(d, "v1", { bay: 8 }).vehicles[0].bay, 8);
});
test("reservations preserve physical stock, reduce availability and reject duplicates or empty stock", () => {
  const d = seed();
  const next = reservePart(d, "v1", "disc");
  assert.equal(next.parts[0].stock, 8);
  assert.equal(next.parts[0].reserved, 1);
  assert.deepEqual(next.vehicles[0].parts, ["disc"]);
  assert.throws(() => reservePart(next, "v1", "disc"), /déjà/);
  assert.throws(() => reservePart(d, "v1", "caliper"), /insuffisant/);
  assert.equal(d.parts[0].reserved, 0);
});
test("saved dossiers, reservations, drafts and audit survive serialization", () => {
  let d = reservePart(seed(), "v1", "pads");
  d = record(
    {
      ...d,
      messages: [
        { id: "message", vehicle: "v1", text: "Brouillon non envoyé" },
      ],
    },
    "v1",
    "Brouillon préparé",
  );
  assert.deepEqual(loadDB(JSON.stringify(d)), d);
  assert.throws(() => loadDB('{"version":2}'), /incompatible/);
});
test("similarity retrieves electrical codes without inventing matches", () => {
  assert.equal(similarCases("P0562 direction intermittente")[0].id, "CAS-001");
  assert.equal(similarCases("vibrations freinage")[0].id, "CAS-002");
  assert.deepEqual(similarCases("xyzzy"), []);
});
test("routes pass through real doorways and never cross a wall", () => {
  for (const zone of zones) {
    const path = findPath([-17, 13], [zone.x, zone.z], walls);
    assert.ok(path.length > 0, zone.id);
    for (const p of path)
      assert.equal(blocked(...p, walls, 0.45), false, zone.id);
    for (let i = 1; i < path.length; i++)
      assert.equal(
        Math.abs(path[i][0] - path[i - 1][0]) +
          Math.abs(path[i][1] - path[i - 1][1]),
        1,
      );
  }
});
test("navigation refuses a destination enclosed by obstacles", () => {
  const enclosure = [{ x: 0, z: 0, w: 3, d: 3 }];
  assert.deepEqual(findPath([-10, 10], [0, 0], enclosure), []);
  assert.equal(blocked(-23, 0, []), true);
});
test("malformed imported records are rejected before they can enter the application", () => {
  const d = seed();
  assert.throws(
    () => loadDB(JSON.stringify({ ...d, vehicles: [{}] })),
    /invalide/,
  );
  assert.throws(
    () =>
      loadDB(
        JSON.stringify({ ...d, parts: [{ ...d.parts[0], reserved: 99 }] }),
      ),
    /invalide/,
  );
});

````

## tests/extensions.test.ts

````typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { seed, loadDB, type Quote } from "../src/domain.ts";
import {
  toggleWork,
  finishWork,
  patchWorkshop,
  workshopFor,
  requestPart,
  duplicateVehicle,
} from "../src/workshop-domain.ts";
import {
  extractRegistration,
  validVIN,
  identifyLocal,
} from "../src/identification.ts";
import { quoteTotals, saveQuote, approveQuote } from "../src/quote-domain.ts";
test("start/pause tracks duration and excludes time paused", () => {
  const start = Date.parse("2026-10-13T01:00:00Z");
  const prior = workshopFor(seed(), "v1").elapsed;
  let d = toggleWork(seed(), "v1", start);
  assert.equal(
    workshopFor(d, "v1").runningSince,
    new Date(start).toISOString(),
  );
  d = toggleWork(d, "v1", start + 120000);
  assert.equal(workshopFor(d, "v1").elapsed, prior + 120);
  assert.equal(workshopFor(d, "v1").runningSince, null);
  d = toggleWork(d, "v1", start + 600000);
  d = toggleWork(d, "v1", start + 630000);
  assert.equal(workshopFor(d, "v1").elapsed, prior + 150);
  assert.equal(workshopFor(seed(), "v1").runningSince, null);
});
test("workshop refuses work without technician or before quote approval", () => {
  const d = seed();
  assert.throws(() => toggleWork(d, "v3"), /statut/);
  d.vehicles[0].technician = "Non affecté";
  assert.throws(() => toggleWork(d, "v1"), /technicien/);
});
test("completion requires checklist and routes to human quality review", () => {
  let d = toggleWork(seed(), "v1");
  assert.throws(() => finishWork(d, "v1"), /contrôle/);
  d = patchWorkshop(
    d,
    "v1",
    { checks: { repair: true, safety: true, test: true } },
    "Checklist",
  );
  d = finishWork(d, "v1");
  assert.equal(d.vehicles[0].status, "Contrôle qualité");
  assert.equal(d.vehicles[0].quality, false);
  assert.equal(workshopFor(d, "v1").runningSince, null);
  assert.deepEqual(loadDB(JSON.stringify(d)), d);
});
test("missing part creates a waiting request without fictitious stock or external order", () => {
  const d = requestPart(seed(), "v1", "caliper");
  assert.equal(workshopFor(d, "v1").requests[0].state, "À valider responsable");
  assert.equal(d.parts.find((p) => p.id === "caliper")?.stock, 0);
  assert.equal(d.orders.length, seed().orders.length);
  assert.throws(() => requestPart(d, "v1", "caliper"), /déjà/);
});
test("duplicate detection separates countries, normalizes plates and checks VIN independently", () => {
  const d = seed();
  const candidate = { ...d.vehicles[0], id: "new", plate: "gh 482 lp" };
  assert.equal(duplicateVehicle(d, candidate)?.id, "v1");
  assert.equal(duplicateVehicle(d, { ...candidate, country: "PT" }), undefined);
  d.vehicles[0].vin = "VF1AAAAA123456789";
  assert.equal(
    duplicateVehicle(d, {
      ...candidate,
      plate: "other",
      country: "PT",
      vin: "VF1AAAAA123456789",
    })?.id,
    "v1",
  );
});
test("registration parser requires explicit labels and never invents a missing VIN or model", () => {
  const fields = extractRegistration(
    "A : DEMO-002\nC.1 : TITULAIRE FICTIF\nD.1 : RENAULT\nD.3 : CLIO\nE : VF1AAAAA123456789",
    "pdf_text",
  );
  assert.equal(fields.find((f) => f.code === "E")?.value, "VF1AAAAA123456789");
  assert.equal(fields.find((f) => f.code === "C.1")?.value, "TITULAIRE FICTIF");
  assert.ok(
    fields.every((f) => f.confirmed === false && f.confidence === null),
  );
  const empty = extractRegistration(
    "Une Renault imaginée, moteur diesel, modèle inconnu",
    "ocr_local",
  );
  assert.ok(empty.every((f) => !f.value));
  assert.equal(
    extractRegistration("E : INVALID-VIN", "ocr_local").find(
      (f) => f.code === "E",
    )?.value,
    "",
  );
});
test("internal identification handles missing, malformed and conflicting data honestly", () => {
  const d = seed();
  assert.equal(identifyLocal(d, { plate: "UNKNOWN" }).state, "not_found");
  assert.equal(
    identifyLocal(d, { vin: "INVALID" }).state,
    "needs_confirmation",
  );
  assert.equal(validVIN("VF1AAAAA123456789"), true);
  assert.equal(validVIN("VF1AAAAI123456789"), false);
  d.vehicles[0].vin = "VF1AAAAA123456789";
  d.vehicles[1].vin = "VF1BBBBB123456789";
  assert.equal(
    identifyLocal(d, { plate: d.vehicles[0].plate, vin: d.vehicles[1].vin })
      .state,
    "conflict",
  );
});
test("quote totals, human approval and immutable approved quotes", () => {
  const q: Quote = {
    id: "q1",
    vehicle: "v3",
    lines: [
      { id: "l1", label: "Opération fictive", quantity: 2, unitPrice: 78 },
      { id: "l2", label: "Autre ligne fictive", quantity: 1, unitPrice: 46 },
    ],
    vat: 20,
    state: "À valider",
    at: new Date().toISOString(),
  };
  assert.deepEqual(quoteTotals(q), { ht: 202, tax: 40.4, total: 242.4 });
  let d = saveQuote(seed(), q);
  d = approveQuote(d, q.id);
  assert.equal(d.quotes?.[0].state, "Validé");
  assert.equal(d.vehicles.find((v) => v.id === "v3")?.status, "Diagnostic");
  assert.throws(() => saveQuote(d, { ...q, vat: 0 }), /validé/);
  assert.throws(
    () =>
      saveQuote(seed(), { ...q, lines: [{ ...q.lines[0], unitPrice: -1 }] }),
    /Vérifiez/,
  );
  assert.deepEqual(loadDB(JSON.stringify(d)), d);
});
test("all ten published GLBs match their hashes and embed their image data", () => {
  const manifest = JSON.parse(
    readFileSync("public/models/manifest.json", "utf8"),
  );
  const assets = manifest.entries.filter((e: any) => e.status === "imported");
  assert.ok(assets.length >= 10);
  assert.equal(manifest.stats.knownBrandModelsImported, 0);
  for (const a of assets) {
    const bytes = readFileSync("public" + a.url);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), a.sha256);
    assert.equal(bytes.readUInt32LE(0), 0x46546c67);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    const json = JSON.parse(
      bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
    );
    assert.ok(
      (json.images || []).every(
        (i: any) => !i.uri && i.bufferView !== undefined,
      ),
    );
    assert.equal(a.licenseStatus, "verified");
    assert.equal(a.generic, true);
  }
});
test("restoration rejects malformed workshop and quote extensions", () => {
  const d = seed();
  assert.throws(
    () =>
      loadDB(JSON.stringify({ ...d, workshop: { v1: { elapsed: "bad" } } })),
    /invalide/,
  );
  assert.throws(() => loadDB(JSON.stringify({ ...d, quotes: {} })), /invalide/);
  assert.throws(
    () =>
      loadDB(
        JSON.stringify({
          ...d,
          quotes: [{ id: "x", vehicle: "missing", lines: [] }],
        }),
      ),
    /invalide/,
  );
});
test("failed storage write does not acknowledge a persisted change", async () => {
  const { persistDB, STORAGE_KEY } = await import("../src/persistence.ts");
  let stored = "previous data";
  const full = {
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  assert.throws(() => persistDB(seed(), full), /refusée/);
  assert.equal(stored, "previous data");
  persistDB(seed(), {
    setItem: (key, value) => {
      assert.equal(key, STORAGE_KEY);
      stored = value;
    },
  });
  assert.equal(JSON.parse(stored).version, 1);
});

````

## tests/guided.test.ts

````typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import { seed, loadDB } from "../src/domain.ts";
import {
  showroomCars,
  waitingVehicles,
  zoneVehicles,
  todaysOrders,
  awaitingOrders,
} from "../src/guided-domain.ts";
test("guided zones separate workshop, delivery, waiting and showroom inventory", () => {
  const db = seed();
  assert.equal(zoneVehicles(db, "atelier").length, 6);
  assert.equal(zoneVehicles(db, "livraison").length, 4);
  assert.equal(zoneVehicles(db, "parking").length, 4);
  assert.equal(waitingVehicles(db).length, 3);
  assert.equal(showroomCars(db).filter((v) => v.available).length, 3);
  assert.equal(
    db.vehicles.filter((v) => v.present !== false && v.status !== "Livré")
      .length,
    14,
  );
});
test("real garages do not acquire simulated people or commercial inventory", () => {
  const db = seed();
  delete db.demoVersion;
  assert.deepEqual(waitingVehicles(db), []);
  assert.deepEqual(showroomCars(db), []);
});
test("today means the Lisbon calendar day; undated orders are never silently dated", () => {
  const db = seed();
  db.orders = [
    {
      id: "today",
      part: db.parts[0].id,
      quantity: 1,
      status: "À valider",
      at: "2026-10-13T23:30:00Z",
    },
    {
      id: "yesterday",
      part: db.parts[0].id,
      quantity: 1,
      status: "Reçue",
      at: "2026-10-13T21:00:00Z",
    },
    { id: "unknown", part: db.parts[0].id, quantity: 1, status: "À valider" },
  ];
  assert.deepEqual(
    todaysOrders(db, new Date("2026-10-14T00:15:00+01:00")).map((o) => o.id),
    ["today"],
  );
  assert.deepEqual(
    awaitingOrders(db).map((o) => o.id),
    ["today", "unknown"],
  );
  assert.deepEqual(loadDB(JSON.stringify(db)).orders, db.orders);
  db.orders[0].at = "bad-date";
  assert.throws(() => loadDB(JSON.stringify(db)));
});

````

## tests/v2.test.ts

````typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { seed, loadDB, vehiclePosition } from "../src/domain.ts";
import { dashboard, isPresent } from "../src/dashboard-domain.ts";
import { team } from "../src/team-data.ts";
import {
  planningAlerts,
  moveAppointment,
  nextAvailable,
  overlaps,
} from "../src/planning-domain.ts";
import { searchDiagnostics } from "../src/diagnostic-domain.ts";
import { proposeVoice, applyVoice } from "../src/voice-domain.ts";
import { Store } from "../server/store.ts";
const command =
  "Il me manque un étrier avant droit pour la BMW. Mets l’intervention en pause et préviens le responsable.";
test("V2 counts and fourteen non-overlapping physical vehicles agree across all modules", () => {
  const db = seed(),
    d = dashboard(db);
  assert.equal(db.vehicles.length, 60);
  assert.equal(team.length, 8);
  assert.equal(d.present.length, 14);
  assert.equal(d.ready.length, 4);
  assert.equal(d.accepted.length, 5);
  assert.equal(db.parts.length, 50);
  assert.equal(db.diagnosticCases?.length, 15);
  assert.ok(d.ready.every((v) => d.present.includes(v)));
  const positions = d.present.map((v) => vehiclePosition(v, db.vehicles));
  assert.equal(new Set(positions.map((p) => p.join(","))).size, 14);
  assert.ok(
    positions.every(([x, z]) => x > -22 && x < 22 && z > -52 && z < 30),
  );
  assert.equal(new Set(db.parts.map((p) => p.id)).size, 50);
  assert.ok(
    db.parts.every(
      (p) =>
        p.stock >= p.reserved && p.reserved >= 0 && p.ref.startsWith("DEMO-"),
    ),
  );
  assert.deepEqual(loadDB(JSON.stringify(db)), db);
});
test("every diagnostic is linked to a CRM record and unconfirmed cases have no invented cause", () => {
  const db = seed();
  const results = searchDiagnostics(db, "");
  assert.equal(results.length, 15);
  for (const r of results) {
    assert.equal(r.case.vehicleId, r.vehicle.id);
    assert.ok(r.case.tests.length >= 2);
    if (!r.case.resolved) assert.equal(r.case.cause, null);
  }
  assert.ok(
    searchDiagnostics(db, "P0562 direction intermittente", "v4").length > 0,
  );
});
test("planning blocks conflicting reassignment and suggests a recorded free interval", () => {
  const db = seed();
  const a = db.appointments!.find((a) => a.vehicle === "v1")!,
    b = db.appointments!.find((a) => a.vehicle === "v5")!;
  assert.ok(overlaps(a, b));
  assert.throws(
    () => moveAppointment(db, a.id, { technician: b.technician }),
    /déjà/,
  );
  assert.throws(
    () => moveAppointment(db, a.id, { technician: "Kader" }),
    /compétence/,
  );
  assert.throws(
    () => moveAppointment(db, a.id, { resource: b.resource }),
    /réservé/,
  );
  const slot = nextAvailable(db, a, Date.parse(a.start));
  assert.ok(slot);
  const candidate = { ...a, start: slot! };
  assert.ok(
    !db.appointments!.some(
      (b) =>
        b.id !== a.id &&
        b.state !== "Terminé" &&
        (b.technician === a.technician || b.resource === a.resource) &&
        overlaps(candidate, b),
    ),
  );
});
test("voice proposes structured actions, requires confirmation and never creates supplier orders", () => {
  const db = seed();
  const p = proposeVoice(db, "v1", command);
  assert.deepEqual(
    p.actions.map((a) => a.type),
    ["pause", "piece", "alert"],
  );
  assert.equal(
    p.actions.find((a) => a.type === "piece")?.part,
    "caliper-right",
  );
  assert.throws(
    () => applyVoice(db, "v1", command, "command", false),
    /Confirmez/,
  );
  const next = applyVoice(db, "v1", command, "command", true);
  assert.equal(next.orders.length, db.orders.length);
  assert.equal(next.workshop?.v1.blocked, true);
  assert.ok(dashboard(next).blocked.some((v) => v.id === "v1"));
  assert.ok(next.alerts?.some((a) => a.vehicle === "v1"));
  assert.equal(
    proposeVoice(
      db,
      "v3",
      "Il me faut deux disques avant pour la Golf.",
    ).actions.find((a) => a.type === "piece")?.quantity,
    2,
  );
  assert.equal(
    proposeVoice(db, "v1", "Ne mets pas en pause.").actions.length,
    0,
  );
});
test("SQLite persists the complete fifteen-step workshop workflow across reopen and validates concurrency", () => {
  const folder = mkdtempSync(join(tmpdir(), "autohub-store-"));
  const file = join(folder, "state.sqlite");
  let store = new Store(file, () => seed());
  let state = store.read();
  let clock = Date.parse("2026-10-13T09:00:00Z");
  const send = (type: string, payload: any = {}) =>
    (state = store.change(
      {
        requestId: crypto.randomUUID(),
        revision: state.revision,
        type,
        vehicle: "v1",
        payload,
      },
      clock,
    ));
  try {
    send("start");
    const began = state.db.workshop!.v1.runningSince;
    clock += 120000;
    const startKey = crypto.randomUUID();
    const before = state.revision;
    const repeated = store.change(
      { requestId: startKey, revision: before, type: "start", vehicle: "v1" },
      clock,
    );
    assert.equal(repeated.db.workshop!.v1.runningSince, began);
    assert.deepEqual(
      store.change(
        { requestId: startKey, revision: before, type: "start", vehicle: "v1" },
        clock,
      ),
      repeated,
    );
    state = repeated;
    store.close();
    store = new Store(file);
    state = store.read();
    assert.equal(state.db.workshop!.v1.runningSince, began);
    send("voice", { text: command, mode: "command", confirmed: true });
    assert.equal(state.db.workshop!.v1.runningSince, null);
    assert.equal(state.db.workshop!.v1.blocked, true);
    assert.ok(
      state.db.appointments!.find((a) => a.vehicle === "v1")?.state ===
        "En pause",
    );
    const r = state.db.workshop!.v1.requests[0];
    assert.throws(
      () => send("approve", { requestId: r.id, compatibilityConfirmed: false }),
      /compatibilité/,
    );
    assert.throws(
      () => send("approve", { requestId: r.id, compatibilityConfirmed: true }),
      /Stock/,
    );
    const incoming = {
      ...state.db,
      parts: state.db.parts.map((p) =>
        p.id === "caliper-right" ? { ...p, stock: 2 } : p,
      ),
    };
    send("snapshot", { db: incoming });
    send("approve", { requestId: r.id, compatibilityConfirmed: true });
    assert.equal(
      state.db.parts.find((p) => p.id === "caliper-right")!.reserved,
      1,
    );
    clock += 180000;
    send("start");
    assert.equal(state.db.workshop!.v1.blocked, false);
    assert.equal(state.db.workshop!.v1.idleElapsed, 180);
    const checked = {
      ...state.db,
      workshop: {
        ...state.db.workshop,
        v1: {
          ...state.db.workshop!.v1,
          checks: { repair: true, safety: true, test: true },
        },
      },
    };
    send("snapshot", { db: checked });
    clock += 60000;
    send("finish");
    assert.equal(state.db.vehicles[0].status, "Contrôle qualité");
    assert.equal(state.db.vehicles[0].bay, null);
    assert.equal(
      state.db.appointments!.find((a) => a.vehicle === "v1")!.state,
      "Terminé",
    );
    assert.equal(state.db.workshop!.v1.runningSince, null);
    const ready = {
      ...state.db,
      vehicles: state.db.vehicles.map((v) =>
        v.id === "v1"
          ? { ...v, quality: true, status: "Prêt à livrer" as const }
          : v,
      ),
    };
    send("snapshot", { db: ready });
    assert.equal(dashboard(state.db).ready.length, 5);
    assert.equal(dashboard(state.db).present.length, 14);
    assert.ok(state.db.audit.length >= 8);
    assert.throws(
      () =>
        store.change(
          {
            requestId: crypto.randomUUID(),
            revision: 0,
            type: "pause",
            vehicle: "v1",
          },
          clock,
        ),
      /changé/,
    );
    store.close();
    store = new Store(file);
    assert.equal(dashboard(store.read().db).ready.length, 5);
  } finally {
    store.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
test("French transcription uncertainty is surfaced before applying a pause", () => {
  const p = proposeVoice(
    seed(),
    "v1",
    "Il me manque un étrier avant droit pour la BMW, mais l'intervention empose et prévient le responsable.",
  );
  assert.deepEqual(
    p.actions.map((a) => a.type),
    ["pause", "piece", "alert"],
  );
  assert.ok(p.warnings.some((w) => w.includes("incertaine")));
});
test("a negative description of an incident is not mistaken for a negated command", () => {
  const p = proposeVoice(
    seed(),
    "v1",
    "La vis de fixation est cassée et je ne peux pas remonter l’étrier.",
    "issue",
  );
  assert.ok(p.actions.some((a) => a.type === "issue"));
  assert.equal(p.conflict, false);
});
test("server refuses a quality-gate bypass even if the client sends a full snapshot", () => {
  const store = new Store(":memory:", () => seed());
  try {
    const s = store.read();
    const forged = {
      ...s.db,
      vehicles: s.db.vehicles.map((v) =>
        v.id === "v1"
          ? {
              ...v,
              status: "Prêt à livrer" as const,
              bay: null,
              quality: false,
            }
          : v,
      ),
    };
    assert.throws(
      () =>
        store.change({
          revision: s.revision,
          requestId: crypto.randomUUID(),
          type: "snapshot",
          payload: { db: forged },
        }),
      /qualité/,
    );
    assert.equal(store.read().revision, 0);
  } finally {
    store.close();
  }
});

````

## tsconfig.json

````json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "server", "vite.config.ts"]
}

````

## vite.config.ts

````typescript
import { defineConfig } from "vite";
import { autohubAPI } from "./server/plugin";
export default defineConfig({
  plugins: [autohubAPI()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "three/addons/controls/OrbitControls.js"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});

````


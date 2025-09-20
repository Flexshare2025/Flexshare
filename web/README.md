## Flex Share (Ride-sharing platform) - Front-end

This document is a quick get-up-and-run description of a front-end (web) project
For more complete information check out：`Project-Overview.md`。

### 1、Environmental requirements

-   Node.js >= 18（recommend LTS）
-   npm >= 9 or pnpm/yarn
-   Google Maps API Key（Enable Maps JavaScript API、Places API、Directions API）

### 2、Directory structure (front end)

```
web/
  src/
    api/
      index.js                # front end interface
    assets/                   # Static Image Resources
    components/               # General Components
      Header/
      Loading/
      Nav/
      ProtectedRoute/
      search-location.jsx
      search-locationv1.jsx
    pages/                    # pages
      Passenger/              # passenger
        component/
          ControlPanel.jsx
          DirectionsProvider.jsx
          MapView.jsx
          OrderList.jsx
          PassengerOrderList.jsx
        index.jsx
        index.scss
      Driver/                 # driver
        PublishRoute/
        Rode/
        index.jsx
        index.scss
      Login/
      Register/
      ForgotPassword/
      NotFound/
    utils/                    # Tools (request, storage, positioning, etc.)
    App.jsx                   # root component
    main.jsx                  # main
    index.css                 # Global Style
    constant.js               # constant
  public/
    manifest.json
  dist/                       # Production of build
  package.json
  vite.config.js
  eslint.config.js
  README.md
```

### 3、Front-end (web) start

1. Enter the directory

```bash
cd web
```

2. Installation of dependencies

```bash
npm install
```

3. Configuring Environment Variables

    in `web/.env.local` New and Configured：

```bash
VITE_GOOGLE_MAPS_API_KEY=你的GoogleMapsAPIKey
```

4. Run locally

```bash
npm run dev
```

5. Production build

```bash
npm run build
```

Build products in `web/dist/`。

### 4、Brief description of key functions (front-end)

-   Passenger Page
    -   Use Google Maps to display your current location and route planner
    -   Support start and end point selection, matching driver's trip list, placing orders
-   Driver Page
    -   Posting routes, managing orders and seating capacity
    -   Login/Register/Retrieve Password: Basic Authentication Process and Protected Routing

### 5、development contract

-   Code style: follows the ESLint/Prettier configuration within the project
-   Component naming: Big Hump, Folders & Entries `index.jsx`/`index.scss`
-   State management: with the component's internal `useState/useEffect`
-   API calls: unified under `web/src/api/`.

### 6、Deployment

-   Use Github Actions to deploy web to AWS S3.

```yml
name: Deploy web to AWS S3

on:
    push:
        branches: [main]

jobs:
    deploy:
        runs-on: ubuntu-latest

        steps:
            - name: Checkout code
              uses: actions/checkout@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: '20'
                  cache: 'npm'
                  cache-dependency-path: './web/package-lock.json'

            - name: Install dependencies and build
              working-directory: ./web
              run: |
                  npm ci
                  npm run build

            - name: Check AWS Region configuration
              run: |
                  if [ -z "${{ secrets.AWS_REGION }}" ]; then
                    echo "Error: AWS_REGION secret is not set"
                    exit 1
                  fi

            - name: Configure AWS credentials
              uses: aws-actions/configure-aws-credentials@v4
              with:
                  aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
                  aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
                  aws-region: ${{ secrets.AWS_REGION }}

            - name: Deploy web to S3
              run: |
                  aws s3 sync ./web/dist s3://${{ secrets.AWS_S3_BUCKET }} --delete
```

### 7. Documentation

-   Front-end Project Overview and Technical Guide：`Project-Overview.md`

### 8. Frequently Asked Questions

-   The map is not displayed/blank:
    -   check `VITE_GOOGLE_MAPS_API_KEY`
    -   Confirm that the relevant Google Maps APIs are enabled
    -   Whether or not browser location permissions are allowed

### 9. Resources

1. （IconFont）：<https://www.iconfont.cn/>
2. React Hooks（ahooks/use-request）：<https://ahooks.js.org/hooks/use-request/index>
3. Ant Design Mobile components：<https://ant-design-mobile.antgroup.com/components/button>
4. Google Maps React ：<https://developers.google.com/codelabs/maps-platform/maps-platform-101-react-js>

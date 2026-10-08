# PeopleDesk frontend

## Tailwind CSS

The frontend uses Tailwind CSS v4 with the Vite plugin. The integration is already
configured; there is no `tailwind.config.js` or PostCSS configuration to create.

To run the frontend from the repository root:

1. Change into the frontend directory: `cd frontend`
2. Install the dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open the local URL printed by Vite.

Tailwind is loaded from `src/index.css`. Use utility classes in React `className`
attributes, for example:

```jsx
<button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
  Save changes
</button>
```

The existing global styles are in the CSS `base` layer and the starter component
styles are in the `components` layer, so Tailwind utilities can override them.
Use `npm run build` to check a production build and `npm run lint` to run ESLint.

function getGuideSidebar() {
  return [
    {
      text: "Introduction",
      items: [
        { text: "Home", link: "/" },
        { text: "What is blaze script", link: "/guide/what-is-blaze-script" },
      ],
    },
    {
      text: "Component",
      collapsible: true,
      items: [
        { text: "Introduction", link: "/component/introduction" },
        { text: "Lifecycle", link: "/component/lifecycle" },
        { text: "Portal", link: "/component/portal" },
      ],
    },
    {
      text: "Documentation",
      collapsible: true,
      collapsed: true,
      items: [
        { text: "Attribute", link: "/doc/attribute" },
        { text: "List Rendering", link: "/doc/list-rendering" },
        { text: "Batch", link: "/doc/batch" },
        { text: "Watch", link: "/doc/watch" },
        { text: "Computed", link: "/doc/computed" },
        { text: "Event Listener", link: "/doc/event" },
        { text: "Handling Input", link: "/doc/input" },
        { text: "Short Code", link: "/doc/short" },
        { text: "Multiple App", link: "/doc/multiple-app" },
      ],
    },
    {
      text: "State Management",
      collapsible: true,
      collapsed: true,
      items: [
        { text: "State", link: "/state-management/state" },
        { text: "Context", link: "/state-management/context" },
      ],
    },
    {
      text: 'Tutorial',
      collapsible: true,
      collapsed: true,
      items: [
        { text: "Create Note App", link: "/app/note" },
      ],
    },
    {
      text: "Plugin",
      collapsible: true,
      collapsed: true,
      items: [
        { text: "Router", link: "/plugin/router" },
        { text: "Helmet", link: "/plugin/helmet" },
        { text: "Extension", link: "/plugin/extension" },
        { text: "Local", link: "/plugin/local" },
        { text: "Media Query", link: "/plugin/media-query" },
        { text: "Query", link: "/plugin/query" },
        { text: "Tester", link: "/plugin/tester" },
      ],
    },
    {
      text: 'API',
      collapsible: true,
      collapsed: true,
      items: [
        { text: "Blaze", link: "/api/blaze" },
      ],
    }
  ];
}

module.exports = {
  title: "Blaze Script",
  description: "Framework Single Page Application",
  themeConfig: {
    nav: [
      { text: "Github", link: "https://github.com/ferdiansyah0611/blaze-script" },
    ],
    sidebar: {
      "/": getGuideSidebar(),
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present Ferdiansyah'
    }
  },
};

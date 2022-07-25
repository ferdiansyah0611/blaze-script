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
      text: "Documentation",
      collapsible: true,
      items: [
        { text: "Lifecycle", link: "/doc/lifecycle" },
        { text: "Attribute", link: "/doc/attribute" },
        { text: "List Rendering", link: "/doc/list-rendering" },
        { text: "Batch", link: "/doc/batch" },
        { text: "Watch", link: "/doc/watch" },
        { text: "Computed", link: "/doc/computed" },
        { text: "Event Listener", link: "/doc/event" },
        { text: "Handling Input", link: "/doc/input" },
        { text: "Short Code", link: "/doc/short" },
        { text: "Multiple App", link: "/doc/multiple-app" },
        { text: "Portal", link: "/doc/portal" },
      ],
    },
    {
      text: "State Management",
      collapsible: true,
      items: [
        { text: "State", link: "/state-management/state" },
        { text: "Context", link: "/state-management/context" },
      ],
    },
    {
      text: "Plugin",
      collapsible: true,
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

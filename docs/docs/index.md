---
layout: home

hero:
    name: Blaze Script
    text: Framework Single Page Application
    tagline: The Future Of Frontend Development
    image:
        src: /logo.png
        alt: VitePress
    actions:
        - theme: brand
          text: Get Started
          link: /guide/what-is-blaze-script
        - theme: alt
          text: View on GitHub
          link: https://github.com/vuejs/vitepress

features:
    - icon: ⚡️
      title: Virtual DOM
      details: Virtual DOM make it run reactively and change when certain circumstances
    - icon: 🖖
      title: Complex Lifecycle
      details: Complete lifecycle can make the application complex
    - icon: 🛠️
      title: HMR
      details: With HMR makes the development process faster
---

<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const members = [
  {
    avatar: 'https://www.github.com/ferdiansyah0611.png',
    name: 'Ferdiansyah',
    title: 'Creator',
    links: [
      { icon: 'github', link: 'https://github.com/ferdiansyah0611' },
      { icon: 'twitter', link: 'https://twitter.com/ferdiansyah0611' }
    ]
  },
]
</script>
<VPTeamMembers style="margin-top: 16px;" size="small" :members="members" />

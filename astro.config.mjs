// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

// 사이드바는 읽는 순서다 — 붙이기 전에 정할 것(릴레이)이 맨 위에 오고,
// 그다음이 두 상황별 안내, 그다음이 붙은 뒤에 매일 쓰는 것들이다.
//
// 항목은 slug 로 묶는다. 같은 slug 의 ko·en 파일이 한 칸을 나눠 쓰므로
// 사이드바 트리를 언어마다 복제하지 않는다.
export default defineConfig({
  site: 'https://agent-channel-mesh-docs.vercel.app',
  integrations: [
    starlight({
      title: 'agent-channel-mesh',
      description: '에이전트끼리 종단 간 암호화로 대화하게 하는 메시. Claude Code · Codex.',
      defaultLocale: 'root',
      locales: {
        root: { label: '한국어', lang: 'ko' },
        en: { label: 'English', lang: 'en' },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/Seungwoo321/agent-channel-mesh',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/Seungwoo321/agent-channel-mesh-docs/edit/main/',
      },
      sidebar: [
        {
          label: '시작하기',
          translations: { en: 'Getting Started' },
          items: [{ slug: 'start/what' }, { slug: 'start/install' }, { slug: 'start/relay' }],
        },
        {
          label: '두 가지 상황',
          translations: { en: 'The Two Situations' },
          items: [{ slug: 'guides/same-machine' }, { slug: 'guides/other-people' }],
        },
        {
          label: '쓰기',
          translations: { en: 'Using It' },
          items: [
            { slug: 'guides/usage' },
            { slug: 'guides/permissions' },
            { slug: 'guides/troubleshooting' },
          ],
        },
        {
          label: '레퍼런스',
          translations: { en: 'Reference' },
          items: [
            { slug: 'reference/tools' },
            { slug: 'reference/config' },
            { slug: 'reference/security' },
          ],
        },
      ],
    }),
  ],
})

<template>
  <div
    class="rimeq-markdown select-text break-words"
    v-html="html"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import type { MarkdownSegment } from '@/types'

// 定义组件属性
const props = defineProps<{ segment: MarkdownSegment }>()

// 初始化解析器
const md = new MarkdownIt({
  html: false,  // 禁用 HTML 标签
  breaks: true, // 换行符转为 <br> 标签
  linkify: true // 自动识别链接
})

// 处理链接属性
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('target' in node) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

// 计算属性：文本转换为 HTML
const html = computed(() => DOMPurify.sanitize(md.render(props.segment.data.content || '')))
</script>

<style lang="scss">
.rimeq-markdown {
  /* 基础 */
  font-size: 14px;
  line-height: 1.6;
  color: inherit;
  /* 清除间距 */
  > *:first-child { margin-top: 0; }
  > *:last-child { margin-bottom: 0; }
  /* 段落 */
  p { margin: 0.6em 0; }
  /* 链接 */
  a {
    color: var(--primary-color);
    text-decoration: none;
    word-break: break-all;
    &:hover { text-decoration: underline; }
  }
  /* 标题 */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    margin: 1em 0 0.5em;
    line-height: 1.3;
    color: inherit;
  }
  h1 { font-size: 1.4em; padding-bottom: 0.3em; }
  h2 { font-size: 1.25em; padding-bottom: 0.3em; }
  h3 { font-size: 1.1em; }
  h4 { font-size: 1em; }
  /* 列表 */
  ul, ol {
    padding-left: 1.4em;
    margin: 0.6em 0;
    li { margin: 0.2em 0; }
  }
  ul { list-style-type: disc; }
  ol { list-style-type: decimal; }
  /* 引用块 */
  blockquote {
    margin: 0.8em 0;
    padding: 0.4em 0.8em;
    opacity: 0.8;
    border-radius: 4px;
  }
  /* 行内代码 */
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    padding: 0.1em 0.3em;
    border-radius: 4px;
    color: var(--primary-active);
  }
  /* 代码块 */
  pre {
    margin: 0.8em 0;
    padding: 0.8em;
    overflow-x: auto;
    border-radius: 6px;
    code {
      color: inherit;
      opacity: 0.8;
      padding: 0;
      white-space: pre;
    }
  }
  /* 表格 */
  table {
    width: 100%;
    margin: 0.8em 0;
    font-size: 0.9em;
    th, td {
      padding: 0.4em 0.6em;
    }
    th {
      font-weight: 600;
      text-align: left;
    }
  }
  /* 分割线 */
  hr {
    height: 1px;
    border: none;
    margin: 1.2em 0;
  }
  /* 图片 */
  img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 0.6em 0;
    display: block;
  }
}
</style>

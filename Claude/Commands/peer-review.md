# Peer Review Triage Task

Another reviewer has provided the findings below. You are the Tech Lead. Your job is NOT to blindly accept them. You must critically evaluate each finding, categorize it, and decide on the action.

## 1. Triage Rules

For every issue reported in the findings, you must classify it into exactly one of these categories:

- **[VALID]:** This is a real bug or necessary improvement. You must provide the exact code fix.
- **[ALREADY FIXED]:** The code already handles this, or it's no longer relevant.
- **[FALSE POSITIVE]:** The reviewer misunderstood the architecture, context, or React patterns. Explain why the reviewer is wrong.
- **[LOW PRIORITY]:** Valid, but not worth blocking the current progress. Convert to a TODO.

## 2. Findings from Peer Review

### Looks Good

- **Shell.tsx** - Clean ResizeObserver pattern with proper cleanup via `ro.disconnect()`. Footer reveal-on-scroll via `marginBottom` + `position: fixed` is solid.
- **AnimalGardenFooter.tsx** - rAF chase loop correctly stored in ref and cleaned up on unmount. Wobble/bunny timers all cleaned up in the unmount effect at line 134–140. `useCallback` correctly applied to click handlers with stable deps.
- **page.tsx** - Hero text update matches PRD. Datalign link correctly uses `hero-company-link` class for ✦ treatment.
- **globals.css** - `::after` pseudo-element for ✦ is positioned well with `absolute` + `right: -0.85em` to avoid layout shift.

---

### 状态机先行（按你 `review.md` 的要求）：

[Idle/Arrive]

   | mouse in bounds

   v

[Chase Wand] ----(mouse leaves + crab active)----> [Chase Crab]

   | dist < stopDist                                 | dist < 40 triggers crab evade

   v                                                 v

[Arrive] <-------------------(no target)--------- [Arrive]

   |

   | idle timer (2s)

   v

[Fufu Idle Bubble] --(3.5s)--> [Spawn Crab + Rest/Run Cycle]

⚠️ **Issues Found (ordered by severity)**

- **[HIGH]** `Garden` **每帧整组件重渲染，低端设备容易掉帧（核心交互风险）**  
当前位置更新在 RAF 中持续 `setCatAPos` / `setCatAState`，会连带整个 garden（花、道具、图片树）一起重渲染。
  Garden.tsxLines 344-351
  useEffect(() => {
  const loop = () => {
  rafRef.current = requestAnimationFrame(loop);
  if (isMobileRef.current || !gardenRef.current) return;
  const r = gardenRef.current.getBoundingClientRect();
  if (r.width === 0) return;
  const { x: wx, y: wy } = wandPos.current;
  Garden.tsxLines 503-507
  posRef.current = next;
  setCatAPos({ ...next });
  setCatAState("walk");
  setCatAFlip(dx < 0);
  setCatADir({ dx, dy });
  **Fix:** 把“静态层”（flowers/props）拆成 `React.memo` 子组件；Fufu/crab 用 `ref + style.transform` 做 imperative 更新，避免每帧 React render。
- **[MEDIUM] 追踪/游走 Y 轴边界是“混合硬编码”，在不同高度下行为不一致**  
crab 的随机 Y 使用固定范围 `20..140 + interactiveOffset`，与 `gardenH` 未联动；视觉上在不同断点会出现“活动带偏窄/偏低”。
  Garden.tsxLines 627-635
  const randomCrabPos = useCallback(() => {
  const fufuX = posRef.current.x;
  let x: number;
  do {
  x = GARDEN_LEFT_PCT + Math.random() * (GARDEN_RIGHT_PCT - GARDEN_LEFT_PCT);
  } while (Math.abs(x - fufuX) < 20);
  *// Random Y between front row and mid-flower row*
  const y = gardenInteractiveArea + 20 + Math.random() * 120;
  **Fix:** 用 `const yMax = gardenH + gardenInteractiveArea - margin` 动态计算范围（例如基于 `r.height`），避免断点漂移。
- **[MEDIUM] 未处理“减少动态效果”偏好（可访问性风险）**  
多个无限动画+RAF未根据 `prefers-reduced-motion` 降级。
  Garden.tsxLines 109-135
  const GARDEN_KEYFRAMES = `
    @keyframes chickShake {
      ...
    }
    @keyframes bubbleFadeIn {
      ...
    }
    @keyframes crabBounce {
      ...
    }
  `
  **Fix:** 增加 `matchMedia("(prefers-reduced-motion: reduce)")` 分支：关闭 RAF chase、停用 bounce/twitch 动画，保留基础静态交互。
- **[LOW] 样式注入无去重标识，未来多实例时可能重复注入**  
当前每次挂载都 append `<style>`，无 `id` 去重。
  Garden.tsxLines 286-291
  useEffect(() => {
  const el = document.createElement("style");
  el.textContent = GARDEN_KEYFRAMES;
  document.head.appendChild(el);
  return () => { document.head.removeChild(el); };
  }, []);
  **Fix:** 给 style 加 `id`（如 `garden-keyframes`），存在则复用；或将 keyframes 放全局 CSS。

✅ **Looks Good**

- 关键定时器/interval/RAF 基本都有 cleanup，内存泄漏风险控制得不错。
- 交互元素（CatB/Bunny）已有键盘可达性（`role="button"`, `tabIndex`, Enter/Space）。
- `next/image` 与 `unoptimized` 的组合对你这类像素 GIF 资源是合理折中。
- 坐标系统已经比早期版本更一致（`r.bottom - e.clientY` + reachable clamp）。

📊 **Summary**

- Files reviewed: **2** (`portfolio/src/components/Garden.tsx`, `portfolio/src/app/about/page.tsx`)
- Critical: **0** | High: **1** | Medium: **2** | Low: **1**

## 3. Output Format

### Triage Decisions

**Finding 1:** [Brief summary of the finding]

**Classification:** [VALID / ALREADY FIXED / FALSE POSITIVE / LOW PRIORITY]

**Lead Decision:** [If VALID, write the code to fix it. If FALSE POSITIVE, write the technical rebuttal.]

*(Repeat for all findings)*

### Execution Plan

- List the exact files that need to be modified based ONLY on the [VALID] findings.
- Provide the final, merged code snippets required to apply these fixes.


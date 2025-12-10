'use client';

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
  triggerOnce?: boolean;
}

interface UseIntersectionObserverResult<T extends Element> {
  ref: RefObject<T | null>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook for detecting when an element enters the viewport
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   triggerOnce: true,
 *   threshold: 0.1,
 * });
 *
 * return (
 *   <div ref={ref}>
 *     {isIntersecting && <HeavyComponent />}
 *   </div>
 * );
 */
export function useIntersectionObserver<T extends Element = HTMLDivElement>({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false,
  triggerOnce = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverResult<T> {
  const ref = useRef<T | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const frozen = useRef(false);

  const callback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (frozen.current && freezeOnceVisible) {
        return;
      }

      setEntry(entry);
      setIsIntersecting(entry.isIntersecting);

      if (entry.isIntersecting && (freezeOnceVisible || triggerOnce)) {
        frozen.current = true;
      }
    },
    [freezeOnceVisible, triggerOnce]
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(callback, observerParams);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [callback, root, rootMargin, threshold]);

  return { ref, isIntersecting, entry };
}

/**
 * Hook for lazy loading components when they become visible
 *
 * @example
 * const { ref, shouldRender } = useLazyRender({ rootMargin: '100px' });
 *
 * return (
 *   <div ref={ref} style={{ minHeight: 200 }}>
 *     {shouldRender ? <Chart /> : <ChartSkeleton />}
 *   </div>
 * );
 */
export function useLazyRender<T extends Element = HTMLDivElement>(
  options: Omit<UseIntersectionObserverOptions, 'triggerOnce' | 'freezeOnceVisible'> = {}
) {
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    ...options,
    triggerOnce: true,
    freezeOnceVisible: true,
  });

  return {
    ref,
    shouldRender: isIntersecting,
  };
}

/**
 * Hook for infinite scroll / load more functionality
 *
 * @example
 * const { ref } = useInfiniteScroll({
 *   onIntersect: loadMore,
 *   enabled: hasNextPage && !isLoading,
 * });
 *
 * return (
 *   <div>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={ref} /> {/* Trigger element *\/}
 *   </div>
 * );
 */
export function useInfiniteScroll<T extends Element = HTMLDivElement>({
  onIntersect,
  enabled = true,
  rootMargin = '200px',
}: {
  onIntersect: () => void;
  enabled?: boolean;
  rootMargin?: string;
}) {
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    rootMargin,
    threshold: 0,
  });

  useEffect(() => {
    if (isIntersecting && enabled) {
      onIntersect();
    }
  }, [isIntersecting, enabled, onIntersect]);

  return { ref };
}

export default useIntersectionObserver;

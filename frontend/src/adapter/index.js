/**
 * 神奇了，这个东西居然没有了，可能跟打包工具有关系
 */
if (!window.caches) {
    window.caches = {
        delete(cacheName) {
            return false
        },
        has(cacheName) {
            return false
        },
        keys() {
            return []
        },
        /**
         *
         * @param request RequestInfo | URL
         * @param options MultiCacheQueryOptions
         */
        match(request, options) {

        },
        open(cacheName) {

        }
    }
}

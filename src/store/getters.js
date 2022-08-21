export default {
	/**
     * getter暂时空
     */
    getGeoHash(state) {
     return state.latitude + state.longitude;
    },
}
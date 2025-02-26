// @unocss-include

// import _ from "lodash";

import {
  h as vnd, defineComponent,
} from 'vue';

// import Panel from 'primevue/panel';

// import { useToast } from 'primevue/usetoast';


const AppToolView = defineComponent({
  name: "AppToolView",
  setup() {

    // const toast = useToast();

    return ()=>{
      return vnd("div", {
      }, "Hello, World!");
    };
  }
})

export default AppToolView;

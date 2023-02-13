<template>
  <div class="columns" v-if="indicator">
    <div class="column is-8">
      <div class="tile is-ancestor">
        <div class="tile is-vertical is-parent">
          <nav class="tile panel is-child">
            <p class="panel-heading">
              <b-taglist attached>
                <b-tag size="is-large" type="is-dark">{{ indicator.name }}</b-tag>
                <b-tag size="is-large" type="is-info">{{ indicator.type }}</b-tag>
              </b-taglist>
            </p>
            <div class="panel-block">
              <div class="content">{{ indicator.description || "No description provided" }}</div>
            </div>
            <div class="panel-block">
              <div class="content">
                <code>{{ indicator.pattern }}</code>
              </div>
            </div>
          </nav>
          <div class="tile is-child">
            <b-tabs v-model="activeTab" position="is-left" :animated="false">
              <b-tab-item>
                <template slot="header">
                  <b-icon icon="sitemap"></b-icon>
                  <span>
                    Observables
                    <b-tag rounded> {{ totalRelatedObservables == null ? "?" : totalRelatedObservables }}</b-tag>
                  </span>
                </template>
                <related-objects
                  source-type="indicator"
                  target-type="Observable"
                  :id="id"
                  @totalUpdated="value => (totalRelatedObservables = value)"
                ></related-objects>
              </b-tab-item>
            </b-tabs>
          </div>
        </div>
      </div>
    </div>
    <div class="column">
      <div class="tile is-ancestor">
        <div class="tile is-vertical is-parent">
          <nav class="tile panel is-child">
            <p class="panel-heading">Info</p>
            <div class="panel-block">
              <table class="table is-fullwidth">
                <tbody>
                  <tr>
                    <th>Location</th>
                    <td>{{ indicator.location }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </nav>
          <nav class="tile panel is-child">
            <p class="panel-heading">Relevant tags</p>
            <div class="panel-block">
              <b-field class="expanded">
                <b-taginput expanded v-model="indicator.tags" icon="tag" placeholder="e.g. CobaltStrike"></b-taginput>
                <p class="control">
                  <button class="button is-primary" @click="saveTags">Save</button>
                </p>
              </b-field>
            </div>
            <small class="panel-block">Observables tagged with these tags will be linked to this indicator.</small>
          </nav>

          <nav class="tile panel is-child">
            <p class="panel-heading">Related indicators</p>
            <div class="panel-block">
              <related-objects
                v-show="totalRelatedIndicators > 0"
                source-type="Indicator"
                inline-icons
                :fields="['name']"
                target-type="Indicator"
                :id="id"
                @totalUpdated="value => (totalRelatedIndicators = value)"
                style="width: 100%"
                ref="relatdIndicatorsList"
              ></related-objects>
            </div>
            <div class="panel-block">
              <b-field class="expanded">
                <b-autocomplete
                  :open-on-focus="true"
                  :keep-first="true"
                  field="name"
                  :clearable="true"
                  :data="filteredIndicators"
                  placeholder="Link new indicator..."
                  v-model="linkedIndicatorNameFilter"
                  @select="option => (linkedIndicator = option)"
                  expanded
                >
                </b-autocomplete>
                <p class="control">
                  <button class="button is-primary" @click="linkIndicator">Link</button>
                </p>
              </b-field>
            </div>
          </nav>

          <nav class="tile panel is-child">
            <p class="panel-heading">Related entities</p>
            <div class="panel-block">
              <related-objects
                v-show="totalRelatedEntities > 0"
                source-type="Indicator"
                inline-icons
                :fields="['name']"
                target-type="Entity"
                :id="id"
                @totalUpdated="value => (totalRelatedEntities = value)"
                style="width: 100%"
                ref="relatdEntitiesList"
              ></related-objects>
            </div>
            <div class="panel-block">
              <b-field class="expanded">
                <b-autocomplete
                  :open-on-focus="true"
                  :keep-first="true"
                  field="name"
                  :clearable="true"
                  :data="filteredEntities"
                  placeholder="Link new indicator..."
                  v-model="linkedEntityNameFilter"
                  @select="option => (linkedEntity = option)"
                  expanded
                >
                </b-autocomplete>
                <p class="control">
                  <button class="button is-primary" @click="linkEntity">Link</button>
                </p>
              </b-field>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import RelatedObjects from "@/components/RelatedObjects";

export default {
  props: ["id"],
  components: {
    RelatedObjects
  },
  data() {
    return {
      indicator: null,
      newTags: [],
      activeTab: null,
      totalRelatedObservables: null,
      totalRelatedIndicators: 0,
      totalRelatedEntities: 0,
      linkedIndicatorNameFilter: "",
      linkedEntityNameFilter: "",
      linkedIndicator: null,
      entities: [],
      indicators: []
    };
  },
  mounted() {
    this.getindicatorDetails();
    this.getIndicatorAutocomplete();
    this.getEntityAutocomplete();
  },
  methods: {
    getindicatorDetails() {
      axios
        .get(`/api/indicator/${this.id}`)
        .then(response => {
          this.indicator = response.data;
          // Switch back to Context view when reloading the page.
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    getIndicatorAutocomplete() {
      axios
        .post("/api/indicatorsearch/", { name: "" })
        .then(response => {
          this.indicators = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    getEntityAutocomplete() {
      axios
        .post("/api/entitysearch/", { name: "" })
        .then(response => {
          this.entities = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    linkIndicator() {
      var params = {
        type_src: "indicator",
        type_dst: "indicator",
        link_src: this.indicator.id,
        link_dst: this.linkedIndicator.id,
        source: "web"
      };
      axios
        .post("/api/link/", params)
        .then(() => {
          // Refresh neighbors list.
          this.$refs.relatdIndicatorsList.fetchNeighbors();
          this.$refs.relatdIndicatorsList.countTotal();
          this.linkedIndicatorNameFilter = "";
          this.linkedIndicator = null;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    linkEntity() {
      var params = {
        type_src: "indicator",
        type_dst: "entity",
        link_src: this.indicator.id,
        link_dst: this.linkedEntity.id,
        source: "web"
      };
      axios
        .post("/api/link/", params)
        .then(() => {
          // Refresh neighbors list.
          this.$refs.relatdEntitiesList.fetchNeighbors();
          this.$refs.relatdEntitiesList.countTotal();
          this.linkedEntityNameFilter = "";
          this.linkedEntity = null;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    saveTags() {
      var params = {
        tags: this.indicator.tags
      };
      axios
        .post(`/api/indicator/${this.id}`, params)
        .then(response => {
          this.indicator = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    }
  },
  computed: {
    filteredIndicators() {
      return this.indicators.filter(indicator => {
        return (
          indicator.name.toLowerCase().includes(this.linkedIndicatorNameFilter.toLowerCase()) &&
          indicator.id != this.indicator.id
        );
      });
    },
    filteredEntities() {
      return this.entities.filter(entity => {
        return entity.name.toLowerCase().includes(this.linkedEntityNameFilter.toLowerCase());
      });
    }
  },
  watch: {
    id: "getindicatorDetails"
  }
};
</script>

<style scoped lang="css">
.expanded {
  width: 100%;
}
</style>

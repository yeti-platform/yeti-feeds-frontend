<template>
  <div class="columns" v-if="entity">
    <div class="column is-8">
      <div class="tile is-ancestor">
        <div class="tile is-vertical is-parent">
          <nav class="tile panel is-child">
            <p class="panel-heading">
              <b-taglist attached>
                <b-tag size="is-large" type="is-dark">{{ entity.name }}</b-tag>
                <b-tag size="is-large" type="is-info">{{ entity.type }}</b-tag>
              </b-taglist>
            </p>
            <div class="panel-block">
              <div class="content">{{ entity.description || "No description provided" }}</div>
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
                  source-type="Entity"
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
            <p class="panel-heading">Info <b-button size="is-small" @click="editEntity"> Edit </b-button></p>
            <div class="panel-block">
              <table class="table is-fullwidth">
                <tbody v-if="entity.type == 'malware'">
                  <tr>
                    <th>Family</th>
                    <td>{{ entity.family }}</td>
                  </tr>
                  <tr>
                    <th>Aliases</th>
                    <td>
                      <b-taglist>
                        <b-tag v-for="alias in entity.aliases" v-bind:key="alias">{{ alias }}</b-tag>
                      </b-taglist>
                    </td>
                  </tr>
                </tbody>

                <tbody v-if="entity.type == 'ttp'">
                  <tr>
                    <th>Killchain stage</th>
                    <td>{{ entity.killchain }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </nav>
          <nav class="tile panel is-child">
            <p class="panel-heading">Relevant tags</p>
            <div class="panel-block">
              <b-field class="expanded">
                <b-taginput expanded v-model="entity.tags" icon="tag" placeholder="e.g. CobaltStrike"></b-taginput>
                <p class="control">
                  <button class="button is-primary" @click="saveTags">Save</button>
                </p>
              </b-field>
            </div>
            <small class="panel-block">Observables tagged with these tags will be linked to this entity.</small>
          </nav>

          <nav class="tile panel is-child">
            <p class="panel-heading">Related entities</p>
            <div class="panel-block">
              <related-objects
                v-show="totalRelatedEntities > 0"
                source-type="Entity"
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
                  placeholder="Link new entity..."
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
import NewObject from "@/views/NewObject";

export default {
  props: ["id"],
  components: {
    RelatedObjects
  },
  data() {
    return {
      entity: null,
      newTags: [],
      activeTab: null,
      totalRelatedObservables: null,
      totalRelatedEntities: 0,
      linkedEntityNameFilter: "",
      linkedEntity: null,
      entities: []
    };
  },
  mounted() {
    this.getentityDetails();
    this.getEntityAutocomplete();
  },
  methods: {
    getentityDetails() {
      axios
        .get(`/api/entity/${this.id}`)
        .then(response => {
          this.entity = response.data;
          // Switch back to Context view when reloading the page.
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    editEntity() {
      this.$buefy.modal.open({
        parent: this,
        component: NewObject,
        hasModalCard: true,
        customClass: "custom-class custom-class-2",
        trapFocus: true,
        props: {
          objectTypeName: this.entity.type,
          object: this.entity,
          endpoint: "entity"
        },
        events: {
          refresh: newEntity => {
            console.log(newEntity);
            this.entity = newEntity;
          }
        }
      });
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
    linkEntity() {
      var params = {
        type_src: "entity",
        type_dst: "entity",
        link_src: this.entity.id,
        link_dst: this.linkedEntity.id,
        source: "web"
      };
      axios
        .post("/api/link/", params)
        .then(() => {
          // Refresh neighbors list.
          this.$refs.relatdEntitiesList.fetchNeighbors();
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
        tags: this.entity.tags
      };
      axios
        .post(`/api/entity/${this.id}`, params)
        .then(response => {
          this.entity = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    }
  },
  computed: {
    filteredEntities() {
      return this.entities.filter(entity => {
        return (
          entity.name.toLowerCase().includes(this.linkedEntityNameFilter.toLowerCase()) && entity.id != this.entity.id
        );
      });
    }
  },
  watch: {
    id: "getentityDetails"
  }
};
</script>

<style scoped lang="css">
.expanded {
  width: 100%;
}
</style>

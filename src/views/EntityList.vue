<template>
  <div class="entity-list columns">
    <div class="column is-three-quarters">
      <b-table
        :data="entities"
        :hoverable="true"
        :narrowed="true"
        checkable
        :total="tableTotal"
        :perPage="tablePerPage"
        backend-pagination
        @page-change="onPageChange"
        :loading="loading"
        paginated
        class="entity-table"
      >
        <template v-slot:default="entity">
          <b-table-column field="name" label="Name">
            <router-link :to="{ name: 'EntityDetails', params: { id: entity.row.id } }">
              {{ entity.row.name }}
            </router-link>
          </b-table-column>

          <b-table-column field="tags" label="Tags">
            <b-taglist>
              <b-tag v-for="tag in entity.row.tags" v-bind:key="tag.name" :type="tag.fresh ? 'is-primary' : ''">
                {{ tag }}
              </b-tag>
            </b-taglist>
          </b-table-column>
        </template>
      </b-table>
    </div>
    <div class="column">
      <section>
        <b-tabs v-model="activeTab" position="is-centered" :animated="false">
          <!-- Search tab item -->
          <b-tab-item label="Search">
            <div class="search">
              <div class="field">
                <b-input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search query + ⏎"
                  icon="search"
                  v-on:keyup.native.enter="searchEntities"
                />
              </div>
              <div class="field">
                <b-checkbox v-model="regexSearch">
                  Use regex (slower)
                </b-checkbox>
              </div>
            </div>
            <br />
            <article class="message tip">
              <div class="message-body content">
                <p>
                  You can run complex queries against the database using the input field above.
                </p>
                <p>
                  By default, the query will be matched against the
                  <code>value</code> attribute of the entities. To match against other attributes, use
                  <code>attribute=query</code>.
                </p>

                <p>Examples:</p>
                <ul>
                  <li>
                    <strong>Generic tag query</strong>:
                    <code>tags=crimeware</code>
                  </li>
                  <li><strong>Gate URLs</strong>: <code>tags=zeus .php$</code> (regex <code>on</code>)</li>
                  <li>
                    <strong>Ransomware C2s</strong>:
                    <code>tags=c2,ransomware</code>
                  </li>
                  <li>
                    <strong>Context</strong>:
                    <code>context.source=FeodoTracker</code>
                  </li>
                </ul>
              </div>
            </article>
          </b-tab-item>

          <b-tab-item label="New entity">
            <b-field label="Entity type">
              <b-select placeholder="Select an entity type" expanded v-model="selectedEntityType">
                <option v-for="template of entityTypes" :value="template" :key="template.name">
                  {{ template.name }}
                </option>
              </b-select>
            </b-field>
            <div v-if="selectedEntityType">
              <b-field :label="field.label" v-for="field in selectedEntityType.fields" :key="field.field">
                <b-input v-model="newEntity[field.field]" v-if="field.type === 'text'" />
                <b-input type="textarea" v-model="newEntity[field.field]" v-if="field.type === 'longtext'" />
                <b-taginput
                  label="Tags"
                  v-model="newEntity[field.field]"
                  v-if="field.type === 'list'"
                  icon="tag"
                ></b-taginput>
              </b-field>
              <div class="buttons">
                <b-button type="is-primary" @click="saveEntity">
                  Save
                </b-button>
              </div>
            </div>
          </b-tab-item>
        </b-tabs>
      </section>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import utils from "@/utils";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";

export default {
  name: "entityList",
  components: {},
  props: {
    searchQuery: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      // Table
      regexSearch: false,
      entities: [],
      tablePage: 1,
      tablePerPage: 50,
      tableTotal: 500, // 5 pages worth should be enough to have time to get a more accurate count
      loading: false,
      // New
      entityTypes: ENTITY_TYPES,
      selectedEntityType: null,
      newEntity: {},
      // Panel
      activeTab: 0
    };
  },
  mounted() {
    this.searchEntities();
  },
  methods: {
    onPageChange(tablePage) {
      this.tablePage = tablePage;
      this.searchEntities(false);
    },
    searchEntities(refreshTotal = true) {
      var params = {
        filter: this.generateSearchParams(this.searchQuery),
        params: {
          regex: this.regexSearch,
          page: this.tablePage
        }
      };
      console.log(params);
      if (refreshTotal) {
        this.countTotal(params);
      }
      this.loading = true;
      axios
        .post("/api/entitysearch/", params)
        .then(response => {
          this.entities = response.data;
          this.loading = false;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    saveEntity() {
      this.newEntity.type = this.selectedEntityType.type;
      axios
        .post("/api/entity/", this.newEntity)
        .then(response => {
          this.$buefy.toast.open({
            message: `Entity ${response.name} saved`,
            type: "is-success"
          });
          this.newEntity = {};
          this.searchEntities();
        })
        .catch(error => {
          this.$buefy.toast.open({
            message: "Error saving entity: " + error,
            type: "is-danger"
          });
        });
    },
    generateSearchParams(searchQuery) {
      var filter = {};
      var queries = searchQuery.split(" ");
      var default_field = "name";

      for (var i in queries) {
        var splitted = queries[i].split("=");
        if (splitted.length == 2) {
          filter[splitted[0]] = splitted[1].split(",");
        } else if (queries[i] !== "") {
          filter[default_field] = queries[i];
        }
      }
      return filter;
    },
    countTotal(params) {
      this.tableTotal = 500;
      axios
        .post("/api/entitysearch/total", params)
        .then(response => {
          this.tableTotal = response.data.total;
        })
        .catch(error => {
          console.log(error);
        });
    },
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    }
  },
  computed: {}
};
</script>

<style>
.entity-table {
  margin-top: 0.4em;
}
</style>

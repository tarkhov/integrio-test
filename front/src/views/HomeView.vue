<template>
  <div class="home">
    <div v-if="movies?.length">
      <img alt="Vue logo" src="../assets/logo.png">
      <Vue3EasyDataTable v-if="movies" :headers="headers" :items="movies" :rows-per-page="10">
        <template #pagination="{ prevPage, nextPage, isFirstPage, isLastPage }">
          <button :disabled="isFirstPage" @click="prevPage">prev page</button>
          <button @click="onNextPage($event, isLastPage, nextPage)">next page</button>
        </template>
      </Vue3EasyDataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import type { Ref } from 'vue'
import useHttp from '@/http/useHttp'
import Vue3EasyDataTable from 'vue3-easy-data-table'
import type { Header, Item } from "vue3-easy-data-table"

const http: any = useHttp()
let chunk: number = 0
const movies: Ref<Item[]> = shallowRef([])
const headers: Header[] = [
  { text: "ID", value: "tconst" },
  { text: "Title", value: "primaryTitle" },
  { text: "Year", value: "startYear", sortable: true },
  { text: "Genres", value: "genres", sortable: true }
]

async function onNextPage(event: any, isLastPage: boolean, callback: any) {
  callback(event)

  if (isLastPage === true) {
    ++chunk
    const { data } = await http.get('/movies', {
      params: {
        page: chunk
      }
    })
    const pageMovies: object[] = data.filter((pageMovie: any) => {
      const existingMovie: any = movies.value.find((movie: any) => {
        return pageMovie.tconst && movie.tconst == pageMovie.tconst
      })
      return !existingMovie
    })
    if (pageMovies.length) {
      movies.value = movies.value.concat(pageMovies)
    }
  }
}

// https://vuejs.org/api/composition-api-lifecycle.html#onserverprefetch
onMounted(async () => {
  const { data } = await http.get('/movies')
  movies.value = data
})
</script>

<style>
.vue3-easy-data-table {
  width: 60%;
  margin: 0 auto 50px;
}

th .header {
  justify-content: center;
}
</style>
